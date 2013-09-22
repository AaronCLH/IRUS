#pragma strict

import System.IO;

//public var data : String = "";
//public var appendToFile : Boolean;
public var Last_Login : String;
private var lastLoginPath : String = "Assets/Resources/User Data/LastLoginRegister.txt";
private var loginRegister : Boolean = true;
private var roadDataPath : String = "Assets/Resources/User Data/Roads Data";
private var urbanDesignDataPath : String = "Assets/Resources/User Data/Urban Design Data";
private var temporaryDataPath : String = "Assets/Resources/Temporary Data";
private var roadTemporaryDataPath : String = "Assets/Resources/Temporary Data/Roads";
private var urbanDesignTemporaryDataPath : String = "Assets/Resources/Temporary Data/Urban Design";
private var databasePath : String = "Assets/Resources/Databases";

function OnLevelWasLoaded (level : int) {
    if(level != 0 && level != 1) {
        loginRegister = true;
    } else {
        loginRegister = false;
    }
}

function Start () {

    if (loginRegister) {
        Last_Login = GetLastLoginTime();

        if(Last_Login != null) {
        	Debug.Log("UserDataBackend log : Last Login Time : " + Last_Login);
        }
        var loginRegister = new StreamWriter(lastLoginPath,true);
        loginRegister.WriteLine(DateTime.Now);
        loginRegister.Close();
    }

    InitializeChangeList();
}

function Update () {

}

public function ReadFile(findFromDate : String) {
	try {
        var streamReader = new StreamReader("Assets/Resources/User Data/TestFile.txt");
        var line = streamReader.ReadLine();
        while (line != null) {
            Debug.Log(line);
            line = streamReader.ReadLine();
        }
        streamReader.Close();
    }
    catch (e) {
        Debug.Log("UserDataBackend log : The file could not be read:");
        Debug.Log(e.Message);
    }
}

public function WriteFile(textToFile : String, append : boolean) {

    var sw = new StreamWriter(temporaryDataPath+"/TestFile.txt",append);

    sw.WriteLine(textToFile);

    sw.Close();
}

// grab latest localized changes and add to global data for the road database
public function AddChanges(unityName : String) {
	
    var userDataPath : String = roadDataPath + "/" + unityName + ".txt";
    var latestUpdate : String = GetLastLine(roadTemporaryDataPath+"/"+unityName+".txt");

    if ( latestUpdate != GetLastLine(userDataPath)) {

        var addChanger = new StreamWriter(userDataPath,true);

    	addChanger.WriteLine(latestUpdate);

    	Debug.Log("UserDataBackend log : Road changes added to global data");
        addChanger.Close();

        //Debug.Log("Global Change List Updated!");
    }
}

// grab the latest global change for the road database
public function RetrieveLastRoadChange(unityName : String) {
    var userDataPath : String = roadDataPath + "/" + unityName + ".txt";
    return GetLastLine(userDataPath);
}

public function RetrieveLastUrbanDesignChange(unityNameString : String) {
    var userDataPath : String = urbanDesignDataPath + "/" + unityNameString + ".txt";
    return GetLastLine(userDataPath);
}

// grab the first local change for the road database
public function RetrieveFirstRoadChange(unityName : String) {
    var userDataPath : String = roadTemporaryDataPath + "/" + unityName + ".txt";
    return GetFirstLine(userDataPath);
}

public function GetAndApplyRoadsChanges() {
    var userDataPath : String = roadDataPath;
    var listOfChanges : String[] = Directory.GetFiles(userDataPath,"*.txt");
    //Debug.Log("listOfChanges = " + listOfChanges.length);
    for (var i = 0; i < listOfChanges.length; i++) {
        //Debug.Log("listOfChanges[" +i+ "] = " + listOfChanges[i]);
        var changes : String = GetLastLine(listOfChanges[i]);
        var unityName : String = changes.Split(","[0])[0];
        gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(changes,true);
        GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).PopulateUserData(changes);
    }
}

public function RestoreDefaultRoad(unityName : String, wardNumber : String) {
    try {   
        var path : String = databasePath + "/Ward_" + wardNumber + "/Preset/Roads Data/" + unityName + ".txt";   
        var defaultSetting : String = GetLastLine(path);
        if(defaultSetting != null) {   
            GameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(defaultSetting,true);
            GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).PopulateUserData(defaultSetting);
            return true;
        }
        return false;
    }
    catch (e) {
        //Debug.Log("UserDataBackend log : No preset available for road " + unityName);
        Debug.Log(e.Message);
        return false;
    }
}

// localized change of road data on temporary data
public function LocalizedChangeListUpdate(unityName : String, textToFile : String) {
    // to prevent multiple entries
    if(textToFile != GetLastLine(roadTemporaryDataPath+"/"+unityName+".txt")){

        var localChange = new StreamWriter(roadTemporaryDataPath + "/" + unityName + ".txt", true);

        localChange.WriteLine(textToFile);

        localChange.Close();

        //Debug.Log("Localized Change List Updated!");
    }
}

/*
    This function returns the localized changes
    Return null when: No such file exists
                      No changes was made before
                      listSize = 0
                      listSize < -1
    
    Return all changes when: listSize = -1
                             listSize > Number of Changes had made
*/
public function ReturnListOfPreviousRoadsChanges(unityName : String, listSize : int) {
    try {
        var path : String = roadTemporaryDataPath + "/" + unityName +".txt";
        var numRows : int = GetNumOfRows(path);
        if ( numRows == null || numRows == 0) {
            Debug.Log("UserDataBackend log : No road changes was made for " + unityName);
            return null;
        }
        if ( listSize == -1 || listSize > numRows) {
            listSize = numRows;
        } else if( listSize == 0 || listSize < -1) {
            return null;
        }
        var lastChanger = new StreamReader(path);
        var arrayReturn : String[] = new String[listSize];
        var pointer : int = 0;
        var arrayIndex : int = 0;

        var line = lastChanger.ReadLine();

        while (line != null) {
            if(pointer < numRows && pointer >= numRows - listSize) {
                arrayReturn[arrayIndex] = line;
                arrayIndex++;
            }
            line = lastChanger.ReadLine();
            pointer++;
        }
        lastChanger.Close();
        return arrayReturn;
    }
    catch (e) {
        Debug.Log("UserDataBackend log : Error on retriving road changes for " + unityName);
        Debug.Log(e.Message);
        return null;
    }
}

/*
    This function returns the localized changes
    Return null when: No such file exists
                      No changes was made before
                      listSize = 0
                      listSize < -1
    
    Return all changes when: listSize = -1
                             listSize > Number of Changes had made
*/
public function ReturnListOfPreviousUrbanDesignChanges(unityNameString : String, listSize : int) {
    try {
        var path : String = urbanDesignTemporaryDataPath + "/" + unityNameString +".txt";
        var numRows : int = GetNumOfRows(path);
        if ( numRows == null || numRows == 0) {
            //Debug.Log("UserDataBackend log : No urban design changes was made for " + unityNameString);
            return null;
        }
        if ( listSize == -1 || listSize > numRows) {
            listSize = numRows;
        } else if( listSize == 0 || listSize < -1) {
            return null;
        }
        var lastChanger = new StreamReader(path);
        var arrayReturn : String[] = new String[listSize];
        var pointer : int = 0;
        var arrayIndex : int = 0;

        var line = lastChanger.ReadLine();

        while (line != null) {
            if(pointer < numRows && pointer >= numRows - listSize) {
                arrayReturn[arrayIndex] = line;
                arrayIndex++;
            }
            line = lastChanger.ReadLine();
            pointer++;
        }
        lastChanger.Close();
        return arrayReturn;
    }
    catch (e) {
        Debug.Log("UserDataBackend log : Error on retriving urban design changes for " + unityNameString);
        Debug.Log(e.Message);
        return null;
    }
}

// localized change of urban design data on temporary data
public function UrbanDesignLocalizedChangeListUpdate(unityName : String, textToFile : String) {
    // to prevent multiple entries
    if(textToFile != GetLastLine(urbanDesignTemporaryDataPath+"/"+unityName+".txt")){

        var localChange = new StreamWriter(urbanDesignTemporaryDataPath + "/" + unityName + ".txt", true);

        localChange.WriteLine(textToFile);

        localChange.Close();

        //Debug.Log("Localized Change List Updated!");
    }
}

public function AddUrbanDesignObjectChanges(unityName : String) {
    var userDataPath : String = urbanDesignDataPath + "/" + unityName + ".txt";
    var latestUpdate : String = GetLastLine(urbanDesignTemporaryDataPath+"/"+unityName+".txt");

    if ( latestUpdate != GetLastLine(userDataPath)) {

        var addChanger = new StreamWriter(userDataPath,true);

        addChanger.WriteLine(latestUpdate);

        Debug.Log("UserDataBackend log : Urban design object changes added to global data");
        addChanger.Close();

        //Debug.Log("Global Change List Updated!");
    }
}

public function GetUrbanDesignObjectsChanges() {
    var userDataPath : String = urbanDesignDataPath;
    var listOfChanges : String[] = Directory.GetFiles(userDataPath,"*.txt");
    //Debug.Log("listOfChanges = " + listOfChanges.length);
    for (var i = 0; i < listOfChanges.length; i++) {
        //Debug.Log("listOfChanges[" +i+ "] = " + listOfChanges[i]);
        var changes : String = GetLastLine(listOfChanges[i]);
        var directories : String[] = listOfChanges[i].Split("/"[0]);
        var unityNameInfo : String[] = directories[directories.length - 1].Split("~"[0]);
        var unityName : String = unityNameInfo[0];
        var sidewalk : String = unityNameInfo[1].Split("."[0])[0];
        if(sidewalk == "SidewalkLeft") {
            GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).containUserDataSidewalkLeft = true;
        } else if (sidewalk == "SidewalkRight") {
            GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).containUserDataSidewalkRight = true;
        }
        //GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group).PopulateUserObjects(changes);
        //GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group).ApplyChanges(changes);
    }
    return true;
}

public function RestoreDefaultUrbanDesignObjects(unityNameString : String, sidewalkObject : GameObject, wardNumber : String) {
    try {
        var path : String = databasePath + "/Ward_" + wardNumber + "/Preset/Urban Design Data/" + unityNameString + ".txt";   
        var defaultSetting : String = GetLastLine(path);
        if(defaultSetting != null) {
            var unityNameInfo : String[] = unityNameString.Split("~"[0]);
            var unityName : String = unityNameInfo[0];
            var sidewalk : String = unityNameInfo[1].Split("."[0])[0];
            if(sidewalkObject.GetComponent(Group).PopulateUserObjects(defaultSetting)) {
            //if(GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group).PopulateUserObjects(defaultSetting)) {
                //Debug.Log("UserDataBackend log : Restore Urban Design Default for " + unityNameString);
                UrbanDesignLocalizedChangeListUpdate(unityNameString,defaultSetting);
                return true;
            }
        } else {
            //Debug.Log("UserDataBackend log : No Default Setting");
        }
        return false;
    } catch (e) {
        Debug.Log("UserDataBackend log : No Preset for urban design objects is found for " + unityNameString);
        Debug.Log(e.Message);
        return false;
    } 
}

public function ApplyUserUrbanDesignObjectsChanges(unityNameString : String, sidewalkObject : GameObject, wardNumber : String) {
    try {
        var path : String = urbanDesignDataPath + "/" + unityNameString + ".txt";   
        var changes : String = GetLastLine(path);
        if(changes != null) {
            var unityNameInfo : String[] = unityNameString.Split("~"[0]);
            var unityName : String = unityNameInfo[0];
            var sidewalk : String = unityNameInfo[1].Split("."[0])[0];
            if(sidewalkObject.GetComponent(Group).PopulateUserObjects(changes)) {
            //if(GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group).PopulateUserObjects(changes)){
                //Debug.Log("UserDataBackend log : Apply Urban Design Changes for " + unityNameString);
                return true;
            }
        }
        return false;
    } catch (e) {
        Debug.Log("UserDataBackend log : No User data for urban design objects is found for " + unityNameString);
        Debug.Log(e.Message);
        return false;
    } 
}

/*
    Here we extract the Road database by Ward Number from user's machine instead of the online database
    In order to match the format of the database, we replace "," with "\t".
*/
public function RetrieveRoadsInfo(wardNumber : String) {
    try {
        var path : String = databasePath + "/Ward_" + wardNumber + "/Ward_" + wardNumber + "_RoadsInfo.csv";
        //var databaseReader = Resources.Load(path, typeof(TextAsset));
        var databaseReader = new StreamReader(path);
        var databaseString : String = "";
        var notFirstOne : boolean = false;

        var line = databaseReader.ReadLine(); // The first line is just the fields' names
        //Debug.Log("Field numbers : " + line.Split(","[0]).length);

        line = databaseReader.ReadLine();

        while (line != null) {
            if(notFirstOne){
                databaseString += "\n";
            }
            databaseString += line.Replace(",","\t");
            line = databaseReader.ReadLine();
            notFirstOne = true;
        }
        databaseReader.Close();
        return databaseString;
    }
    catch (e) {
        Debug.Log("UserDataBackend log : No Database is found for Ward Number " + wardNumber);
        Debug.Log(e.Message);
        return null;
    }
}

public function RetrieveIntersectionInfo(wardNumber : String) {
    try {
        var path : String = databasePath + "/Ward_" + wardNumber + "/Ward_" + wardNumber + "_Intersections.csv";
        var databaseReader = new StreamReader(path);
        var databaseString : String = "";
        var notFirstOne : boolean = false;

        var line = databaseReader.ReadLine(); // The first line is just the fields' names
        //Debug.Log("Field numbers : " + line.Split(","[0]).length);

        line = databaseReader.ReadLine();

        while (line != null) {
            if(notFirstOne){
                databaseString += "\n";
            }
            databaseString += line;
            line = databaseReader.ReadLine();
            notFirstOne = true;
        }
        databaseReader.Close();
        return databaseString;
    }
    catch (e) {
        Debug.Log("UserDataBackend log : No Database is found for Ward Number " + wardNumber);
        Debug.Log(e.Message);
        return null;
    }
}

public function RetrieveRoadsPresetInfo(wardNumber : String) {
    try {
        var path : String = databasePath + "/Ward_" + wardNumber + "/Preset/Roads Data/";   
        var listOfChanges : String[] = Directory.GetFiles(path,"*.txt");
        for (var i = 0; i < listOfChanges.length; i++) {
            var changes : String = GetLastLine(listOfChanges[i]);
            var unityName : String = changes.Split(","[0])[0];
            gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(changes,true);
            GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).PopulateUserData(changes);
        }
        return true;
    } catch (e) {
        Debug.Log("UserDataBackend log : No Preset for roads is found for Ward Number " + wardNumber);
        Debug.Log(e.Message);
        return false;
    }
}

public function RetrieveUrbanDesignPresetInfo(wardNumber : String) {
    try {
        var path : String = databasePath + "/Ward_" + wardNumber + "/Preset/Urban Design Data/";   
        var listOfChanges : String[] = Directory.GetFiles(path,"*.txt");
        for (var i = 0; i < listOfChanges.length; i++) {
            var changes : String = GetLastLine(listOfChanges[i]);
            var directories : String[] = listOfChanges[i].Split("/"[0]);
            var unityNameInfo : String[] = directories[directories.length - 1].Split("~"[0]);
            var unityName : String = unityNameInfo[0];
            var sidewalk : String = unityNameInfo[1].Split("."[0])[0];
            if(sidewalk == "SidewalkLeft") {
                GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).containPresetSidewalkLeft = true;
            } else if (sidewalk == "SidewalkRight") {
                GameObject.Find("Road Segments/" + unityName).GetComponent(InstantiateRoadElements).containPresetSidewalkRight = true;
            }
            //Debug.Log("UserDataBackend log : 1 = " + typeof GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group));
            //GameObject.Find("Road Segments/" + unityName + "/" + sidewalk).GetComponent(Group).PopulateUserObjects(changes);
            //Debug.Log("UserDataBackend log : changes = " + changes);
        }
        return true;
    } catch (e) {
        Debug.Log("UserDataBackend log : No Preset for urban design objects is found for Ward Number " + wardNumber);
        Debug.Log(e.Message);
        return false;
    }
}

public function GetLastLoginTime() {
	try {
        var streamReader = new StreamReader(lastLoginPath);
        var line = streamReader.ReadLine();
        var lastLoginTime = line;
        while (line != null) {
            line = streamReader.ReadLine();
            if(line != null) {
            	lastLoginTime = line;
            }
        }
        streamReader.Close();
        return lastLoginTime;
    }
    catch (e) {
        Debug.Log("UserDataBackend log : The file could not be read:");
        Debug.Log(e.Message);
        Debug.Log("UserDataBackend log : User first login.. Now creating new LoginRegister File.");
        return null;
    }
}

private function InitializeChangeList() {
    //var changeListFolder = new Directory();
    if(Directory.Exists(temporaryDataPath) == true) {
        Directory.Delete(temporaryDataPath,true);
    }
    Directory.CreateDirectory(temporaryDataPath);
    Directory.CreateDirectory(roadTemporaryDataPath);
    Directory.CreateDirectory(urbanDesignTemporaryDataPath);
}

private function GetFirstLine(path : String) {
    try {
        var file = new StreamReader(path);
        var line = file.ReadLine();
        file.Close();
        return line;
    }
    catch (e) {
        //Debug.Log("The file could not be read:");
        //Debug.Log(e.Message);
        return null;
    }
}

private function GetLastLine(path : String) {
    try {
        var file = new StreamReader(path);
        var line = file.ReadLine();
        var lastLine = line;
        while (line != null) {
            line = file.ReadLine();
            if(line != null) {
                lastLine = line;
            }
        }
        file.Close();
        return lastLine;
    }
    catch (e) {
        //Debug.Log("The file could not be read:");
        //Debug.Log(e.Message);
        return null;
    }
}

/*
    Return null when: No such file exists
    Return 0 when: the first line is null
*/
public function GetNumOfRows(path : String) : int {
    try {
        var numRows : int = 0;
        var file = new StreamReader(path);
        var line = file.ReadLine();
        
        while (line != null) {
            numRows++;
            line = file.ReadLine();
        }
        file.Close();
        return numRows;
    }
    catch (e) {
        //Debug.Log(e);
        return;
    }
}






