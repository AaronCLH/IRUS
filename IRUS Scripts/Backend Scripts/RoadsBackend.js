#pragma strict

/*

$mysql_host = "mysql13.000webhost.com";
$mysql_database = "a9566172_irus";
$mysql_user = "a9566172_irus";
$mysql_password = "John7Lewis";

*/

var hs_get: WWW;
var hs_post: WWW;
var maxLeft: int = 10;
var maxRight: int = 5;
private var inProcess : Boolean = false;
public var dataRecievedByUser : Boolean = true;
private var returnData : String = "";

function Start () {
	//StartCoroutine(postScore("123", true, 2, ["Sidewalk", "RoadSegment"], [0.2, 0.3], 3, ["Sidewalk", "RoadSegments", "Curb"], [0.3, 0.4, 0.5], "Line", 0.2));
	//StartCoroutine(postScore("Bobby", "2344", "aa2@hotmail.com"));
	//StartCoroutine(RetrieveRoadProperties("123232323"));
}

function Update () {

}

private var secretKey = "hsldfnslkanbq23qwrq3rwef"; // Edit this value and make sure it's the same as the one stored on the server
var addScoreUrl = "http://irusdevteam.netai.net/addscore.php?"; //be sure to add a ? to your url
var addDataToTableUrl = "http://irusdevteam.netai.net/addDataToTable.php?";
var retrieveScoreUrl = "http://irusdevteam.netai.net/retrievescore.php?"; 
var retrieveDatabaseUrl = "http://irusdevteam.netai.net/";    
 
 
function postScore(PIN: String, isOneWay: Boolean, numSegmentsLeft: int, leftTypes: String[], leftWidths: float[], numSegmentsRight: int , rightTypes: String[], rightWidths: float[], medianType: String, medianWidth: float) {
    //This connects to a server side php script that will add the name and score to a MySQL DB.
    // Supply it with a string representing the players name and the players score.
   var hash=Md5Sum(PIN + secretKey);
   
   var highscore_url = addScoreUrl + "PIN=" + WWW.EscapeURL(PIN) + "&OW=";
   if (isOneWay) highscore_url += WWW.EscapeURL("1");
   else highscore_url += WWW.EscapeURL("0");
   
   highscore_url += "&NSL=" + WWW.EscapeURL(numSegmentsLeft.ToString());
   for (var i = 0 ; i < maxLeft; i++){
   		if (i < numSegmentsLeft){
   			highscore_url += "&L" + (i+1) + "T=" + WWW.EscapeURL(leftTypes[i]);
   		}
   		else highscore_url += "&L" + (i+1) + "T=" + WWW.EscapeURL("NULL");
   }
   for (i = 0 ; i < maxLeft; i++){
   		if (i < numSegmentsLeft){
   			highscore_url += "&L" + (i+1) + "W=" + WWW.EscapeURL(leftWidths[i].ToString());
   		}
   		else highscore_url += "&L" + (i+1) + "W=" + WWW.EscapeURL("NULL");
   }
   
   highscore_url += "&NSR=" + WWW.EscapeURL(numSegmentsRight.ToString());
   for (i = 0 ; i < maxLeft; i++){
   		if (i < numSegmentsRight){
   			highscore_url += "&R" + (i+1) + "T=" + WWW.EscapeURL(rightTypes[i]);
   		}
   		else highscore_url += "&R" + (i+1) + "T=" + WWW.EscapeURL("NULL");
   }
   for (i = 0 ; i < maxLeft; i++){
   		if (i < numSegmentsRight){
   			highscore_url += "&R" + (i+1) + "W=" + WWW.EscapeURL(rightWidths[i].ToString());
   		}
   		else highscore_url += "&R" + (i+1) + "W=" + WWW.EscapeURL("NULL");
   }   
   
   	highscore_url += "&MT=" + WWW.EscapeURL(medianType) + "&MW" + WWW.EscapeURL(medianWidth.ToString()) + "&hash=" + hash ;
    // Post the URL to the site and create a download object to get the result.
    hs_post = WWW(highscore_url);
    yield hs_post; // Wait until the download is done
    if(hs_post.error) {
        print("There was an error posting the high score: " + hs_post.error);
    }
}

/*
    // Get the scores from the MySQL DB to display in a GUIText.
    function getScores() {
        gameObject.guiText.text = "Loading Scores";
        hs_get = WWW(highscoreUrl);
        yield hs_get;
     
        if(hs_get.error) {
            print("There was an error getting the high score: " + hs_get.error);
        } else {
            gameObject.guiText.text = hs_get.data; // this is a GUIText that will display the scores in game.
        }
    }
*/

function RetrieveRoadProperties(PIN : String){
	var retrievescore_URL = retrieveScoreUrl + "PIN=" + WWW.EscapeURL(PIN);
	hs_get = WWW(retrievescore_URL);
    yield hs_get; // Wait until the download is done
    if(hs_get.error) {
        print("There was an error posting the high score: " + hs_get.error);
    }
    else Debug.Log(hs_get.text);
}

function isProcessing() {
    return inProcess;
}

function dataReceivedByUserYet() {
    return dataRecievedByUser;
}

function RetrieveDatabase(tableName : String, phpName : String){
    Debug.Log("Retrieving Database..");
    inProcess = true;
    //var retrievedatabase_URL = retrieveDatabaseUrl + "retrieveDatabase.php" + "?tableName=" + WWW.EscapeURL(tableName);
    var retrievedatabase_URL = "http://irusdevteam.netai.net/" + WWW.EscapeURL(phpName) + "?tableName=" + WWW.EscapeURL(tableName);
    //Debug.Log("retrievedatabase_URL = " + retrievedatabase_URL);
    returnData = "";
    hs_get = WWW(retrievedatabase_URL);
    yield hs_get; // Wait until the download is done
    if(hs_get.error) {
        print("There was an error retrieving the database: " + hs_get.error);
    } else {
        returnData = hs_get.text;
        Debug.Log("RoadsBackend log: returnData.Length" + returnData.length);
        //Debug.Log("RoadsBackend log: returnData = "+ returnData);
        Debug.Log("Retrieve Success!");
    }
    dataRecievedByUser = false;
    inProcess = false;
}

function RetrieveDatabaseResult(tableName : String){
    return returnData;
}

function addDataToTable(unityName: String, isOneWay: Boolean, numSegmentsLeft: int, leftTypes: String[], leftWidths: float[], numSegmentsRight: int , rightTypes: String[], rightWidths: float[], medianType: String, medianWidth: float) {
    //This connects to a server side php script that will add the name and score to a MySQL DB.
    // Supply it with a string representing the players name and the players score.

    var hash=Md5Sum(unityName + secretKey);

    var append_url = addDataToTableUrl + "UNAME=" + WWW.EscapeURL(unityName) + "&OW=";
    if (isOneWay) append_url += WWW.EscapeURL("1");
    else append_url += WWW.EscapeURL("0");

    append_url += "&NSL=" + WWW.EscapeURL(numSegmentsLeft.ToString());
    
    append_url += "&LT=";
    var leftTypeStrings : String;
    for(var i = 0; i < leftTypes.length; i++){
        leftTypeStrings += DataParse.ConvertBetweenTypesAndCode(leftTypes[i]);
    }
    append_url += WWW.EscapeURL(leftTypeStrings);

    append_url += "&LW=";
    var leftWidthsStrings : String;
    for (i = 0 ; i < leftWidths.length; i++){
        leftWidthsStrings += leftWidths[i].ToString() + "_";
    }
    append_url += WWW.EscapeURL(leftWidthsStrings);

    append_url += "&NSR=" + WWW.EscapeURL(numSegmentsRight.ToString());
    
    append_url += "&RT=";
    var rightTypeStrings : String;
    for(var j = 0; j < rightTypes.length; j++){
        rightTypeStrings += DataParse.ConvertBetweenTypesAndCode(rightTypes[j]);
    }
    append_url += WWW.EscapeURL(rightTypeStrings);

    append_url += "&RW=";
    var rightWidthsStrings : String;
    for (i = 0 ; i < rightWidths.length; i++){
        rightWidthsStrings += rightWidths[i].ToString() + "_";
    }
    append_url += WWW.EscapeURL(rightWidthsStrings);


    append_url += "&MT=" + WWW.EscapeURL(medianType) + "&MW" + WWW.EscapeURL(medianWidth.ToString()) + "&hash=" + hash ;
    // Post the URL to the site and create a download object to get the result.
    hs_post = WWW(append_url);
    yield hs_post; // Wait until the download is done
    if(hs_post.error) {
        print("There was an error posting the road segment information: " + hs_post.error);
    }
}

static function Md5Sum(strToEncrypt: String)
{
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


