#pragma strict
// Attach this script to the parent object of all the road segments in the hierarchy.  It will then go through each of them and add the Instantiate objects script.  

/* Uses the following function 
function postScore(PIN: String, isOneWay: Boolean, numSegmentsLeft: int, leftTypes: String[], leftWidths: float[], numSegmentsRight: int , rightTypes: String[], rightWidths: float[], medianType: String, medianWidth: float) 

*/

public var TableNameForRoads : String;
public var ImportDataFromOnlineDatabase : Boolean;
public var ImportUsersData : Boolean;
public var ImportPresetData : Boolean;
public var WardNumber : String;
public var roadData : String[,];
public var NumOfFieldsInDatabase : int = 17;

private var retrieveRoadsPhp : String = "retrieveDatabase.php";
private var userRoadsPhp : String = "retrieveUserTable.php";
private var backend : RoadsBackend;
private var roadWidth : float;
private var roadPIN : String;
private var databaseResult : String = "";
private var importDatabase : Boolean = false;

private var fadeInForLoginScene : Boolean;
private var fadeInForGameScene : Boolean;

function Awake () {
	backend = gameObject.Find("RoadHandler").GetComponent(RoadsBackend);
	if(Application.loadedLevelName == "Main Menu") fadeInForLoginScene = true;
	fadeInForGameScene = false;
}

function OnEnable () {

}

function OnLevelWasLoaded (level : int) {
	fadeInForLoginScene = false;
	if (level == 0) {
		fadeInForLoginScene = true;
	} else if (level == 2) { // Make sure the level is the game scene ie. King Street Current for now
		fadeInForGameScene = true;
	} else {

	}
}

function Start () {
	if(WardNumber != ""){
		// Processing intersection is not included if the data is imported from the online database
		if(ImportDataFromOnlineDatabase && TableNameForRoads != "") {
			Debug.Log("CreateAllRoads log : Table Name For Roads to be retrieved = " + TableNameForRoads);
			while(backend.isProcessing() || !backend.dataReceivedByUserYet()){
				yield;
			}

			yield StartCoroutine(backend.RetrieveDatabase(TableNameForRoads,retrieveRoadsPhp));

			databaseResult = backend.RetrieveDatabaseResult(TableNameForRoads);
			backend.dataRecievedByUser = true;
			
			if (databaseResult != "" && !(databaseResult.Substring(0,12) == "Query failed")){
				Debug.Log("CreateAllRoads log : Online Database Received!");
				ProcessRoadDatabase(databaseResult);
			} else {
				Debug.Log("CreateAllRoads log : Receive Errors from RetrieveDatabase RoadsBackend.js");
			}
		} else {
			ProcessRoadDatabase(gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveRoadsInfo(WardNumber));
		}
	} else {
		Debug.Log("CreateAllRoads log : Target database is unknown because ward number of the roads is not specified.");
	}

	Debug.Log("CreateAllRoads log : Start Initializing Roads");
	GetUrbanDesignObjectsPresetData();
	GetUrbanDesignObjectsUserData();
	for (var child: Transform in gameObject.transform){
		if(child.gameObject.name.Contains("ROAD")) {
			var roadWidthString: String = child.gameObject.name;
			var tempString : String[] = roadWidthString.Split("_"[0]);
			roadWidth = parseFloat(tempString[5]);
			if(ImportPresetData) {
				if(WardNumber != "") GameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).RestoreDefaultRoad(false, roadWidth, child.gameObject, true, WardNumber);
			} else {
				GameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).InitializeRoad(false, roadWidth, child.gameObject, true);
			}
		}
	}
	LoadRoadUserData();
	if(WardNumber != "") {
		ProcessIntersectionDatabase(gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveIntersectionInfo(WardNumber));
		importDatabase = true;
	}
	Debug.Log("CreateAllRoads log : Finish Initializing Roads");
	FadeScene();
}

private function ProcessIntersectionDatabase(data : String) {
	Debug.Log("CreateAllRoads log : Processing Intersections..");

	var values : String[] = data.Split("\n"[0]);
	var numFound : int = 0;
	for(var i = 0; i < values.length; i++) {
		var tempString : String[] = values[i].Split(","[0]);
		for(var child : Transform in gameObject.transform) {
			if(child.gameObject.name.Contains("INTERSECTION")) {
				var roadIntersection : InstantiateIntersections = child.gameObject.GetComponent(InstantiateIntersections);
				if(tempString[0] == roadIntersection.unityName) {
					roadIntersection.PopulateVariables(tempString[1],tempString[2]); // tempString[1] is the intersectionStreets
					numFound++;
				}
			}
		}
	}

	for (var child: Transform in gameObject.transform) {
		if(child.gameObject.name.Contains("INTERSECTION")) {
			child.GetComponent(InstantiateIntersections).ModifyIntersection();
		}
	}
	Debug.Log("CreateAllRoads log : Number of Intersections that matches the database = " + numFound);
}

private function ProcessRoadDatabase(data: String){

	Debug.Log("CreateAllRoads log : Processing Database..");

	var values : String[] = data.Split("\n"[0]);
	var arrayLimit : int = 0;

	for(var i = values.length - 1; i>=0; i--){
		//To check if it the data type we want: NumOfFieldsInDatabase refers to the no. of fields in the database table
		//This is just to address the redundant string appended behind the return string from the online database
		//Debug.Log("CreateAllRoads log : Number of Fields in Database = " + NumOfFieldsInDatabase);
		if(values[i].Split("\t"[0]).length == NumOfFieldsInDatabase ){
		  arrayLimit = i + 1;	  
		  break;
		}
	}

	roadData = new String[arrayLimit,NumOfFieldsInDatabase];
	for(var k = 0; k < arrayLimit; k++){
		/*
			Please verify that the roadInfo we are going to assign to is formatted in the same way
			as in the retrieveDatabase.php every time we attempt to change the table structure:

			php	->	'UNITY_NAME'	'OBJECTID'	'WARD_NO'	'WARD_2010'	'OBJ_TYPE'	'PIN'
			..->	'X_COORD'	'Y_COORD'	'JURISDICTI'	'STREET_CLA'	'STREET_NAM'
			..->	'strtWdth'	'cnnctnStrt'	'cnnctnnd'	'TO_STREET'		'FROM_STREET'
			..->	'Insctn_Nm'

		*/
		var roadInfo : String[] = values[k].Split("\t"[0]);
		for(var j = 0; j < roadInfo.length; j++){
			roadData[k,j] = roadInfo[j];
		}

	}
	/*
		for(var t = 0; t < arrayLimit; t++){
			Debug.Log("roadData[t].length = " + roadData[t,0].length);
			Debug.Log("roadData["+t+"] = " + roadData[t,0]);
		}
	*/

	var numFound : int = 0;

	for(var child : Transform in gameObject.transform){
		if(child.gameObject.name.Contains("ROAD")) {
			var roadSegment : InstantiateRoadElements = child.gameObject.GetComponent(InstantiateRoadElements);
			for(var x = 0; x < arrayLimit; x++){
				if(roadData[x,0] == roadSegment.unityName){
					for(var y = 0; y < NumOfFieldsInDatabase; y++){
						roadSegment.PopulateVariables(roadData[x,y],y);
					}
					numFound++;
				}
			}
		}
		
	}
	/*
		Debug.Log("ProcessDatabase log: RoadSegment Count = " + gameObject.transform.childCount);
		Debug.Log("ProcessDatabase log: databaseResult length = " + values.length);
		Debug.Log("ProcessDatabase log: numFound = " + numFound);
		Debug.Log("ProcessDatabase log: roadData[0,0] = " + roadData[0,0]);
		Debug.Log("ProcessDatabase log: roadData[0,1] = " + roadData[0,1]);
		Debug.Log("ProcessDatabase log: roadData[0,2] = " + roadData[0,2]);
		Debug.Log("ProcessDatabase log: roadData[0,3] = " + roadData[0,3]);
		Debug.Log("ProcessDatabase log: roadData[0,4] = " + roadData[0,4]);
		Debug.Log("ProcessDatabase log: roadData[0,5] = " + roadData[0,5]);
		Debug.Log("ProcessDatabase log: roadData[0,6] = " + roadData[0,6]);
		Debug.Log("ProcessDatabase log: roadData[0,7] = " + roadData[0,7]);
		Debug.Log("ProcessDatabase log: roadData[0,8] = " + roadData[0,8]);
		Debug.Log("ProcessDatabase log: roadData[0,9] = " + roadData[0,9]);
		Debug.Log("ProcessDatabase log: roadData[0,10] = " + roadData[0,10]);
		Debug.Log("ProcessDatabase log: roadData[0,11] = " + roadData[0,11]);
		Debug.Log("ProcessDatabase log: roadData[0,12] = " + roadData[0,12]);
		Debug.Log("ProcessDatabase log: roadData[0,13] = " + roadData[0,13]);
	*/
	Debug.Log("CreateAllRoads log : Number of Road segments that matches the database = " + numFound);

}

private function GetUrbanDesignObjectsPresetData() {
	if(ImportPresetData) gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveUrbanDesignPresetInfo(WardNumber);
}

private function GetUrbanDesignObjectsUserData() {
	if(ImportUsersData) {
		gameObject.Find("DataHandler").GetComponent(UserDataBackend).GetUrbanDesignObjectsChanges();
	} else {
		Debug.Log("CreateAllRoads log : Not using user's urban design objects data");
	}
}

private function LoadRoadPresetData() {
	if(ImportPresetData) gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveRoadsPresetInfo(WardNumber);
}

private function LoadRoadUserData() {
	if(ImportUsersData) {
		gameObject.Find("DataHandler").GetComponent(UserDataBackend).GetAndApplyRoadsChanges();
	} else {
		Debug.Log("CreateAllRoads log : Not using user's road data");
		/*
			if(tableName != ""){
				while(backend.isProcessing() || !backend.dataReceivedByUserYet()){
					//Debug.Log("Waiting Database... dataRecievedByUser = " + backend.dataRecievedByUser);
					yield;
				}

				yield StartCoroutine(backend.RetrieveDatabase(tableName,userRoadsPhp));

				var userDatabaseResult : String = backend.RetrieveDatabaseResult(tableName);
				backend.dataRecievedByUser = true;
				if (userDatabaseResult != ""){
					Debug.Log("userDatabaseResult received!");
					//ProcessDatabase(userDatabaseResult);
				}
			}
		*/
	}
}

//The first half will be the road segments in the same block, and the second half will be the intersection(s) attached with it/them. They are joined by the charactor "&".
public function FindSegmentsInSameBlock(unityName : String) {
	//potential problem: for now there is only one Road Segments Object
	//Debug.Log("CreateAllRoads log: FindSegmentsInSameBlock for " + unityName);
	var returnRoads : String = "";
	var returnIntersections : String = "";
	var notFirstOne : Boolean = false;
	var notIntersectionFirstOne : Boolean = false;
	var streetName : String;
	var toStreet : String;
	var fromStreet : String;

	//Debug.Log("CreateAllRoads log : FindSegmentsInSameBlock roadData.GetLength(0) = " + roadData.GetLength(0));

	for (var i = 0; i < roadData.GetLength(0); i++) {	
		if (roadData[i,0] == unityName) {
			streetName = roadData[i,10];
			toStreet = roadData[i,14];
			fromStreet = roadData[i,15];
		}
	}

	for (var j = 0; j < roadData.GetLength(0); j++) {		
		if (roadData[j,10] == streetName && roadData[j,14] == toStreet && roadData[j,15] == fromStreet) {
			if(roadData[j,0] != unityName) {
				if(notFirstOne) {
					returnRoads += ",";
				}
				returnRoads += roadData[j,0];
			}
			if(roadData[j,16] != "") {
				if(notIntersectionFirstOne) {
					returnIntersections += ";";
				}
				returnIntersections += roadData[j,16];
				notIntersectionFirstOne = true;
			}
			notFirstOne = true;
		}
	}
	//Debug.Log("CreateAllRoads log : FindSegmentsInSameBlock returnString = " + (returnRoads + "&" + returnIntersections));
	return (returnRoads + "&" + returnIntersections);
}

private function FadeScene() {
	if(fadeInForLoginScene) GameObject.Find("/Camera").GetComponent(MainMenu).startFadeIn();
	if(fadeInForGameScene) GameObject.Find("/First Person Controller/Main Camera").GetComponent(FirstPersonMainCamera).startFadeIn();
}






