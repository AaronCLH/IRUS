#pragma strict

/*
The backend.js is involved with creating a connection to the database and it retrieves information for the owernshipinfo and setback info classes.  We created a connection to google datastore database before, but this is not a good database for adding in new entries.  So I have created a free hosting account on 000 web hosting and created a MYSQL database there.  I have created PHP scripts in the public_HTML folder in the file manager and these php scripts are connected to the Unity using the WWW class.  

o	I have written two functions for the Ownershipinfo class to connect to the php scripts.  UpdateOnDatabase updates the values of the variables on the database and GetInfoFromDatabase retrieves the values of each of the variables from the database.  

o	These two functions also need to be added to setback info class.  You can just copy and paste the code and then change the names of the variables being passed to the database to correspond to the variables for the SetbackInfo class.  The php files and the database needs to be created for the Setback Info.   

o	After doing this, you must go into the Land Use Editor and then make changes to the Information Editor (I've already done most of the work but you will have to debug the Custom Fields).  Then you must make appropriate changes to the Parcel Editor to replace the calls to encodeJson and decodeJson are called with function calls to UpdateOnDatabase or GetInfoFromDatabase. 
 
*/

// All of the stuff below will be removed once the database connection stuff with 000 web hosting has been completed. Anything with the JSon in it will be removed eventually. 
// ****************************************************************************
private var IDENTITY : String = "gHiGbyMOvztaZviN0LKu";
private var URL : String = "https://thisisforirusdevteam.appspot.com/wiki";
//private var URL : String = "http://localhost:8080/wiki";	// local dev environment
static var SCRIPT_HOST : String = "First Person Controller";
//	since we can't transfer a newline character through json,
//	we replace all the newline characters with this string to "remember" the newline characters
static var NEWLINE_REPLACE : String = "////30624770////";

/*
	supported operations	- update			(require jsondata field)
							- retrieve			(does not require jsondata field)
							- getlastupdate		(does not require jsondata field)	 not implemented yet, useful for solving synchronization problems
*/
private var formFields : String[] = ["operation", "teranet", "entity", "jsondata"];
private var jsonString : String;
private var inProcess: Boolean = false;

public function isProcessing () {
	return inProcess;
}
// should yield when call this function
// 	because requests don't accumulate / buffer up
// 	therefore if request(1) has not yet finished, and request(2) is made, request(2) will be ignored (cus of inProcess boolean)
// another way to make sure your request will be proccessed is to do : while (backend.isProcessing()) yield; before sendRequest
//	this will "busy wait" till backend is free
// also, since yield doesn't work with static funciton, this has to be public instead
public function sendRequest (formData : String[]) {
	if (!inProcess) {
		inProcess = true;
		var form : WWWForm = new WWWForm();
		form.AddField("identity", IDENTITY);
		for (var i : int = 0; i < formData.length; i++) {
			form.AddField(formFields[i], formData[i]);
		}
		var www = new WWW(URL, form);
		yield www;
		if (www.error == null) {
			jsonString = www.text;
		} else {
			jsonString = null;	// error
		}
		//Debug.Log(jsonString);
		inProcess = false;
	}}

// call this to get the result after the request
// and of course, you should wait (yield) till the request is done in order to get the correct result
// getResult ()	:	null	-	fail .. many possible reasons
//								e.g. request timeout, invalid request (double check the formData you passed in), other connection problems...
//				:	string	-	successful .. could be empty string!
public function getResult () {
	return jsonString;
}

// *************************************************************************************
// The stuff to remove ends here


class SetbackInfo {
	public var RefArray			: int[];
	public var DistArray		: float[];
	public var MaxHeight		: float;
	public var MinHeight		: float;
	public var Encumberances	: String;
	public var ZoningClass		: String;
	public var IsException		: boolean;

	public function encodeToJSON () {
		var encodeIArray : Function = function (a : int[]) {
			if (a == null) return 'null';
			var ret : String = '[';
			for (var i : int = 0; i < a.length; i++) { ret += a[i]; if (i < a.length-1) ret += ","; }
			return ret+"]";
		};
		var encodeFArray : Function = function (a : float[]) {
			if (a == null) return 'null';
			var ret : String = '[';
			for (var i : int = 0; i < a.length; i++) { ret += a[i]; if (i < a.length-1) ret += ","; }
			return ret+"]";
		};
		return ('{"RefArray":'		+encodeIArray(RefArray)			+","+
				'"DistArray":'		+encodeFArray(DistArray)		+","+
				'"MaxHeight":'		+MaxHeight						+","+
				'"MinHeight":'		+MinHeight						+","+
				'"Encumberances":'	+'"'+Encumberances+'"'			+","+
				'"ZoningClass":'	+'"'+ZoningClass+'"'			+","+
				'"IsException":'	+(IsException+"").ToLower()		+"}").Replace("\n", Backend.NEWLINE_REPLACE);
	}
	 
	public function decodeFromJSON (jsonString : String) {
		var parsed = JSONParse.JSONParse(jsonString);
		if (parsed["RefArray"] != null) {
			RefArray = new int[parsed["RefArray"].length];
		} else {
			RefArray = [];
		}
		if (parsed["DistArray"] != null) {
			DistArray = new float[parsed["DistArray"].length];
		} else {
			DistArray = [];
		}
		// they should have the same size
		for (var i : int = 0; i < RefArray.length; i++) {
			RefArray[i] = parsed["RefArray"][i];
			DistArray[i] = parsed["DistArray"][i];
		}
		MaxHeight = parsed["MaxHeight"];
		MinHeight = parsed["MinHeight"];
		Encumberances = (parsed["Encumberances"] as String).Replace("\n", "\\n").Replace(Backend.NEWLINE_REPLACE, "\n");
		ZoningClass = parsed["ZoningClass"];
		IsException = parsed["IsException"];
	}
}

class OwnershipInfo {
	public var Addresses			: String[];
	public var AssessmentRollNum	: String;
	public var AssessedValue		: String;
	public var OwnerManager			: String;
	public var ConstructionDate		: String;
	public var AdditionalFields		: String[];
	public var AdditionalValues		: String[];
	public var LastUpdated			: String;	// only incoming
	private var InProcess			: Boolean = false;
	private var hs_get: WWW;
	private var hs_post: WWW;
	private var secretKey="hsldfnslkanbq23qwrq3rwef"; // Edit this value and make sure it's the same as the one stored on the server
	private var OwnershipUpdate_URL="http://irusdevteam.netai.net/UpdateOwnershipInfo.php?"; //be sure to add a ? to your url
	private var OwnershipRetrieve_URL ="http://irusdevteam.netai.net/RetrieveOwnershipInfo.php?";    	
		
	function OwnershipInfo () {
		// fresh copy
		Addresses = new String[1];
		Addresses[0] = "";
		AssessmentRollNum = "";
		AssessedValue = "$0";
		OwnerManager = "";
		ConstructionDate = "";
		AdditionalFields = new String[3];
		AdditionalValues = new String[3];
		AdditionalFields[0] = "";
		AdditionalFields[1] = "";
		AdditionalFields[2] = "";
		AdditionalValues[0] = "";
		AdditionalValues[1] = "";
		AdditionalValues[2] = "";
	}
	public function getCopy () {
		var newCopy : OwnershipInfo = new OwnershipInfo();
		newCopy.Addresses[0] = Addresses[0];
		newCopy.AssessmentRollNum = AssessmentRollNum;
		newCopy.AssessedValue = AssessedValue;
		newCopy.OwnerManager = OwnerManager;
		newCopy.ConstructionDate = ConstructionDate;
		newCopy.AdditionalFields[0] = AdditionalFields[0];
		newCopy.AdditionalFields[1] = AdditionalFields[1];
		newCopy.AdditionalFields[2] = AdditionalFields[2];
		newCopy.AdditionalValues[0] = AdditionalValues[0];
		newCopy.AdditionalValues[1] = AdditionalValues[1];
		newCopy.AdditionalValues[2] = AdditionalValues[2];
		return newCopy;
	}
	public function PrintStuff(){
		Debug.Log("Address: " + Addresses[0] + " AssessmentRollNum:" + AssessmentRollNum + " AssessedValue:" + AssessedValue + " OwnerManager:" + OwnerManager + " ConstructionDate: " + ConstructionDate + "AF0:" + AdditionalFields[0] + "AF1:" +AdditionalFields[1] + "AF2:" +AdditionalFields[2] + "AV0:" +AdditionalValues[0] + "AV1:" + AdditionalValues[1]+ "AV2:" + AdditionalValues[2]);
	}
	
	// A new function added to connect to the 000 web hosting server.  This function updates the values on the server.  
	public function UpdateOnDatabase(PIN: String){
		var update_URL: String;  // Creates the connection string to the PHP scripts on the server  We now add paramaters to this string.  for example,  aaronsserver.net?PIN=22323&email=hahah  is the right format for a the connection.    
    	
    	var hash = Md5Sum(PIN + secretKey);  // The hash is used by the php to verify the user isnt a hacker.  Basically, it is encoded here, sent 
   			update_URL = OwnershipUpdate_URL + "PIN=" + WWW.EscapeURL(PIN) + "&Address=";
   			var address: String = "";
   			for (var str: String in Addresses){
   				address += str;
   			}
   			update_URL += WWW.EscapeURL(EmptyStringToNull(address)) + "&ARN=" + WWW.EscapeURL(EmptyStringToNull(AssessmentRollNum)) + "&AV=" + WWW.EscapeURL(EmptyStringToNull(AssessedValue)) + "&OM=" + WWW.EscapeURL(EmptyStringToNull(OwnerManager)) + "&CD=" + WWW.EscapeURL(EmptyStringToNull(ConstructionDate));
   			var additionalFieldsSize: int = AdditionalFields.length;
   			var additionalValuesSize: int = AdditionalValues.length;
   			for (var i = 0 ; i < 3; i++){
   				if (i < additionalFieldsSize){
   				update_URL += "&A" + (i+1) + "F=" + WWW.EscapeURL(EmptyStringToNull(AdditionalFields[i]));
   				}
   				else update_URL += "&A" + (i+1) + "F=" + WWW.EscapeURL("NULL");
   			}
   			for (i = 0 ; i < 3; i++){
   				if (i < additionalValuesSize){
   				update_URL += "&A" + (i+1) + "V=" + WWW.EscapeURL(EmptyStringToNull(AdditionalValues[i]));
   				}
   				else update_URL += "&A" + (i+1) + "V=" + WWW.EscapeURL("NULL");
   			}   				
   			update_URL += "&hash=" + hash ;  // This is the final connection string.  

   			Debug.Log(update_URL);      		
    		// Post the URL to the site and create a download object to get the result.
    		hs_post = WWW(update_URL);
    		yield hs_post; // Wait until the download is done
    		if(hs_post.error) {
        		print("There was an error posting the high score: " + hs_post.error);
    		}

	}
	// THis function retrieves information from the database stored on the 000 web hosting server.  It is not complete yet.  You can see the string that is retrieved and then parse that string and then update the variables.  Remember that there is a \t between each value and a \n at the end which will be helpful for parsing.  
	
	// The function should return true if the request worked.  It should return false if not.  
	public function GetInfoFromDatabase(PIN: String){
		Debug.Log(PIN);
		var retrievescore_URL = OwnershipRetrieve_URL + "PIN=" + WWW.EscapeURL(PIN);
		hs_get = WWW(retrievescore_URL);
    	yield hs_get; // Wait until the download is done
    	if(hs_get.error) {
        print("There was an error posting the high score: " + hs_get.error);
    	}
   		else {
   			Debug.Log(hs_get.text);
  			SetData(hs_get.text);
  			PrintStuff();
   		}
	}

	private function SetData( dataString: String){
 		var i: int = 0 ; 
   		var wordStart: int = 0;
   		var word: int = 0;
   		while (i < hs_get.text.length){
   			if (dataString[i] == '\t'){
   				MatchToVariable(word, dataString.Substring(wordStart, i - wordStart));
   				word++;
   				i++;
   				wordStart = i;
   			}
   			else if (dataString[i] == '\n') {
   				MatchToVariable(word, dataString.Substring(wordStart, i - wordStart));
   				return;
   			}
   			else i++;
   		}
	}
		
   	private function MatchToVariable(word: int, val: String){
   		Debug.Log(val + "Word #: " + word);
   		if (word == 0) Addresses[0] = val;
   		else if (word == 1)AssessmentRollNum = val;
   		else if (word == 2)AssessedValue = val;
   		else if (word == 3) OwnerManager = val;
   		else if (word == 4) ConstructionDate = val;
   		else if (word == 5) AdditionalFields[0] = val;
   		else if (word == 6) AdditionalFields[1] = val;
   		else if (word == 7) AdditionalFields[2] = val;
   		else if (word == 8) AdditionalValues[0] = val;
   		else if (word == 9) AdditionalValues[1] = val;
   		else if (word == 10) AdditionalValues[2] = val;
   	}
   		
   			
   					
		
	// Encodes the secret key
	public function Md5Sum(strToEncrypt: String){
		var encoding = System.Text.UTF8Encoding();
		var bytes = encoding.GetBytes(strToEncrypt);
		// encrypt bytes
		var md5 = System.Security.Cryptography.MD5CryptoServiceProvider();
		var hashBytes:byte[] = md5.ComputeHash(bytes);
		// Convert the encrypted bytes back to a string (base 16)
		var hashString = "";
		for (var i = 0; i < hashBytes.Length; i++)
		{
			hashString += System.Convert.ToString(hashBytes[i], 16).PadLeft(2, "0"[0]);
		} 
		return hashString.PadLeft(32, "0"[0]);
	}

	public function encodeToJSON () {
		var encodeSArray : Function = function (field : String, a : String[]) {
			if (a == null) return '"'+field+'":null';
			var ret : String = '"'+field+'":[';
			for (var i : int = 0; i < a.length; i++) { ret += '"'+a[i]+'"'; if (i < a.length-1) ret += ","; }
			return ret+"]";
		};
		var encodeString : Function = function (field : String, s : String) { return '"'+field+'":'+'"'+s+'"'; };
		var jsonString : String;
		jsonString = "{"+encodeSArray("Addresses",			Addresses)						+	","
						+encodeString("AssessmentRollNum",	AssessmentRollNum)				+	","
						+encodeString("AssessedValue",		AssessedValue)					+	","
						+encodeString("OwnerManager",		OwnerManager)					+	","
						+encodeString("ConstructionDate",	ConstructionDate)				+	","
						+encodeSArray("AdditionalFields",	AdditionalFields)				+	","
						+encodeSArray("AdditionalValues",	AdditionalValues)				+	","
						+encodeString("LastUpdated",		"2012-07-12T03:59:21.348043Z")	+	"}";	// date does not matter because it will be updated on the server side
		//Debug.Log(jsonString.Replace("\n","\\n"));
		return jsonString.Replace("\n", Backend.NEWLINE_REPLACE); // just hope user won't type ////30624770////
	}
	
	public function EmptyStringToNull (str: String){
		if (str == "") return "NULL";
		else return str;
	}
	public function decodeFromJSON (jsonString : String) {
		var parsed = JSONParse.JSONParse(jsonString);
		if (parsed["Addresses"] != null) {
			Addresses = new String[parsed["Addresses"].length];
			System.Array.Copy(parsed["Addresses"].ToBuiltin(String), Addresses,
				System.Convert.ToInt32(parsed["Addresses"].length));
			for (var i : int = 0; i < Addresses.length; i++) {
				Addresses[i] = Addresses[i].Replace("\n", "\\n"); // we should only recognize ////30624770//// as newline
				Addresses[i] = Addresses[i].Replace(Backend.NEWLINE_REPLACE, "\n");
			}
		} else {
			// if data not corrupted, this shouldn't happen
			Addresses = new String[1];
			Addresses[0] = "";
		}
		AssessmentRollNum = parsed["AssessmentRollNum"];
		AssessedValue = parsed["AssessedValue"];
		OwnerManager = parsed["OwnerManager"];
		ConstructionDate = parsed["ConstructionDate"];
		if (parsed["AdditionalFields"] != null) {
			AdditionalFields = new String[parsed["AdditionalFields"].length];
			System.Array.Copy(parsed["AdditionalFields"].ToBuiltin(String), AdditionalFields,
				System.Convert.ToInt32(parsed["AdditionalFields"].length));
		} else {
			AdditionalFields = null;
		}
		if (parsed["AdditionalValues"] != null) {
			AdditionalValues = new String[parsed["AdditionalValues"].length];
			System.Array.Copy(parsed["AdditionalValues"].ToBuiltin(String), AdditionalValues,
				System.Convert.ToInt32(parsed["AdditionalValues"].length));
		} else {
			AdditionalValues = null;
		}
		LastUpdated = parsed["LastUpdated"];
	}

	
}

/*
function Start () {

	var p : OwnershipInfo = new OwnershipInfo();

	p.Addresses = ["dfadsfsaf","ca"];
	p.AssessmentRollNum = "23-12412-41241-3412";
	p.AssessedValue = "23423423";
	p.OwnerManager = "irusOwner";
	p.ConstructionDate = "2012-07-12T03:59:21.348043Z";
	p.AdditionalFields = ["color"];
	p.AdditionalValues = ["red"];
	p.LastUpdated = "20adwww";

	jsonString = p.encode();
	
	print(jsonString);

	yield sendRequest(["update", "241312", jsonString]);

	yield sendRequest(["", "241312"]);

	p.decode(jsonString);
	print(p.Addresses[1]);
	print(p.AssessmentRollNum);
	print(p.AssessedValue);
	print(p.OwnerManager);
	print(p.ConstructionDate);
	print(p.AdditionalFields[0]);
	print(p.AdditionalValues[0]);
	print(p.LastUpdated);
	//sendRequest(["retrieve", "ppppppppp"]);
}*/

