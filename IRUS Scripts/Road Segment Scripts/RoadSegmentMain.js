#pragma strict




// The RoadElementsArray Script is used to store an array of prefabs that are instantiated through this script. The prefabs are saved in the Roads Prefab Folder contained in the Scene Prefab Folder in The Project view.  These Prefabs were dragged into the public variable roadElementPrefabs of the instance of the script that has been added to the RoadHandler GameObject in the Hierarchy.   Here is the current Order.  Please update as necessary. 

/*
	roadElementPrefabs Array Elements: 
	0   -  YellowLine
	1   -  WhiteLine
	2   -  Sidewalk



	roadElementTexturesLeft  Array Elements

	0 - BikeLane
	1 - Bus Rapid Transit
	2 - Car
	3 - Light Rail Transit
	4 - Parking
	5 - Sidewalk
	6 - Separated Median
	7 - Light Truck
	8 - Heavy Truck
	9 - Green Space

	roadElementTexturesRight  Array Elements

	0 - BikeLane
	1 - Bus Rapid Transit
	2 - Car
	3 - Light Rail Transit
	4 - Parking
	5 - Sidewalk
	6 - Separated Median
	7 - Light Truck
	8 - Heavy Truck
	9 - Green Space

*/


/* The InstantiateRoadElement Script provides the following function for instantiating a gameobject. 

	public function CreateRoadElement (prefabObject: GameObject, objWidth: float, objectHolder: String, offsetx: float){
*/

//public var skin : GUISkin;

public var texturesLeft: Texture2D[];
public var texturesRight: Texture2D[];
public var texturesMedian: Texture2D[];
public var accessoriesTexture: Texture2D[];
//public var roadElementSelected: GameObject;

//public var testTexture_X : float = 0;
//public var testTexture_Y : float = 0;
//public var testTexture_Width : float = 100;
//public var testTexture_Height : float = 100;
//public var testTexture : Texture2D;


function Start () {
	texturesLeft = gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementTexturesLeft;
	texturesRight = gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementTexturesRight;
	texturesMedian = gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementTexturesMedian;
	accessoriesTexture = gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementAccessoriesTextures;
	//var testTexture = Texture2D (100, 100);
	/*
	testTexture = Texture2D(100,100);
	for (var y : int = 0; y < testTexture.height; ++y) {
        for (var x : int = 0; x < testTexture.width; ++x) {
            var color = (x&y) ? Color.clear : Color.magenta;
            testTexture.SetPixel (x, y, color);
        }
    }
	testTexture.Apply();
	*/
}

public function GetPrefab( type : String){
	
	for (var gm: GameObject in gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementPrefabs){
		if (gm.name == type) return gm;
	}
	return null;
}

private function GetType( name : String ) {
	var elementType : String;
	if (name == "Car") elementType = "Empty";
	else if (name == "Light Truck") elementType = "Empty";
	else if (name == "Heavy Truck") elementType = "Empty";
	else if (name == "Sidewalk") elementType = "Sidewalk";
	else if (name == "Parking") elementType = "Parking"; //need parking lines
	else if (name == "BikeLane") elementType = "BikeLane"; //need solid white line with bike texture on road
	else if (name == "Green Space") elementType = "Buffer";
	else if (name == "Painted Line") elementType = "YellowLine";
	else if (name == "Turning Lane") elementType = "TurningLane"; //need turning arrows and solid&dotted lines
	else if (name == "Separated Median") elementType = "SeparatedMedian";
	else if (name == "Light Rail Transit") elementType = "LRTLine"; // need rail prefab	
	else if (name == "Bus Rapid Transit") elementType = "BRTLane"; // need solid and dotted lines
	else if (name == "Median Bus Rapid Transit") elementType = "Double BRTLane";
	else if (name == "Median Light Rail Transit") elementType = "Double LRTLine";
	else elementType = "Empty";
	return elementType;
}

private function GetHeight( name : String ) {
	if (name == "Sidewalk") return 0.3;
	else if (name == "Separated Median") return 0.3;
	else if (name == "Green Space") return 0.3;
	else return 0.01;
}

public function RestoreDefaultRoad(isOneWay: Boolean, roadWidth: float, roadSegment: GameObject, registerDatabase : Boolean, wardNumber : String) : Boolean {
	if(!GameObject.Find("DataHandler").GetComponent(UserDataBackend).RestoreDefaultRoad(roadSegment.GetComponent(InstantiateRoadElements).unityName,wardNumber)) {
		InitializeRoad(isOneWay,roadWidth,roadSegment,registerDatabase);
		return false;
	}
	return true;
}

public function InitializeRoad(isOneWay: Boolean, roadWidth: float, roadSegment: GameObject, registerDatabase : Boolean) : Boolean {
	var numSegmentsLeft : int;
	var numSegmentsRight : int;
	var leftTypes : String[];
	var rightTypes : String[];
	var leftWidths : float[];
	var rightWidths : float[];
	var medianType : String;
	var medianWidth : float;
	if (roadWidth < 15.0) {
		numSegmentsLeft = 2;
		numSegmentsRight = 2;
		leftTypes = ["Sidewalk","Car"];
		leftWidths = [roadWidth * .2, roadWidth * .29];
		rightTypes = ["Sidewalk","Car"];
		rightWidths = [roadWidth * .2, roadWidth * .29];
		medianType = "Painted Line";
		medianWidth = roadWidth * 0.02;
	} else if (15.0 <= roadWidth && roadWidth <= 18.0){
		numSegmentsLeft = 3;
		numSegmentsRight = 3;
		leftTypes = ["Sidewalk","BikeLane","Car"];
		leftWidths = [roadWidth * .1, roadWidth * .1, roadWidth * .29];
		rightTypes = ["Sidewalk","BikeLane","Car"];
		rightWidths = [roadWidth * .1, roadWidth * .1, roadWidth * .29];
		medianType = "Painted Line";
		medianWidth = roadWidth * 0.02;
	} else if (18.0 < roadWidth && roadWidth <= 30.0){
		numSegmentsLeft = 4;
		numSegmentsRight = 4;
		leftTypes = ["Sidewalk","BikeLane","Car","Car"];
		leftWidths = [roadWidth * .1, roadWidth * .1, roadWidth * .14, roadWidth * .14];
		rightTypes = ["Sidewalk","BikeLane","Car","Car"];
		rightWidths = [roadWidth * .1, roadWidth * .1, roadWidth * .14, roadWidth * .14];
		medianType = "Painted Line";
		medianWidth = roadWidth * 0.04;
	}
	else {
		Debug.Log("RoadSegmentMain log : Not initializing road " + roadSegment.GetComponent(InstantiateRoadElements).unityName + " because width greater than 30m");
		return false;
	}
	UpdateRoadElements(roadSegment, isOneWay, roadWidth, numSegmentsLeft, leftTypes, leftWidths, numSegmentsRight, rightTypes, rightWidths, medianType, medianWidth, registerDatabase, true);
	return true;
}

// This function draws the roadSegment game object with the parameters and update the instantiateRoadElements scripts' parameters
public function UpdateRoadElements(roadSegment: GameObject, isOneWay: Boolean, roadWidth: float, numSegmentsLeft: int, leftTypes: String[], leftWidths: float[], numSegmentsRight: int, rightTypes: String[], rightWidths: float[], medianType: String, medianWidth: float, registerDatabase : Boolean, onFirstCreation : Boolean) {
	for (var child : Transform in roadSegment.transform){
		UnityEngine.Object.Destroy(child.gameObject);
	}

	var offset : float = 0;
	var roadSegmentInfo : InstantiateRoadElements = roadSegment.GetComponent(InstantiateRoadElements);
	var unityName = roadSegmentInfo.unityName;

	roadSegmentInfo.intersectionEndPointsA.Clear();
	roadSegmentInfo.intersectionEndPointsB.Clear();
	
	var sidewalkName : String = "SidewalkLeft";

	for (var i = 0; i < numSegmentsLeft; i++) {
		if(isOneWay && i >= (numSegmentsLeft-1)/2) {
			sidewalkName = "SidewalkRight";
		}
		if (GetType(leftTypes[i]) != "Empty") {
			roadSegmentInfo.CreateRoadElement(GetPrefab(GetType(leftTypes[i])), leftWidths[i], leftTypes[i], offset, GetHeight(leftTypes[i]), sidewalkName);
		}
		if (i > 0){
			if (GetType(leftTypes[i]) == "Empty" && GetType(leftTypes[i-1]) == "Empty"){
				roadSegmentInfo.CreateRoadElement(GetPrefab("DottedWhiteLine"), .05 , "DottedWhiteLine", offset, GetHeight(leftTypes[i]),"DottedWhiteLine");
			} else if (GetType(leftTypes[i]) == "BikeLane" && GetType(leftTypes[i-1]) == "Empty") {
				roadSegmentInfo.CreateRoadElement(GetPrefab("WhiteLine"), .05 , "WhiteLine", offset, GetHeight(leftTypes[i]) + 0.001,"WhiteLine");
			} else if (GetType(leftTypes[i]) == "Empty" && GetType(leftTypes[i-1]) == "BikeLane") {
				roadSegmentInfo.CreateRoadElement(GetPrefab("WhiteLine"), .05 , "WhiteLine", offset, GetHeight(leftTypes[i-1]) + 0.001,"WhiteLine");
			}
		}
		offset += leftWidths[i];
	}
	if (!isOneWay){
		if (medianType != null && GetType(medianType) != "Empty") {
			roadSegmentInfo.CreateRoadElement(GetPrefab(GetType(medianType)), medianWidth, "Median", offset, GetHeight(medianType),"Median");
		}
		offset += medianWidth;
		sidewalkName = "SidewalkRight";
		for (i = numSegmentsRight - 1 ; i >= 0 ; i--){
			if (GetType(rightTypes[i]) != "Empty"){
				roadSegmentInfo.CreateRoadElement(GetPrefab(GetType(rightTypes[i])), rightWidths[i], rightTypes[i], offset, GetHeight(rightTypes[i]), sidewalkName);
			}
			if (i < numSegmentsRight - 1){
				if (GetType(rightTypes[i]) == "Empty" && GetType(rightTypes[i+1]) == "Empty"){
					roadSegmentInfo.CreateRoadElement(GetPrefab("DottedWhiteLine"), .05 , "DottedWhiteLine", offset, GetHeight(rightTypes[i]),"DottedWhiteLine");
				} else if (GetType(rightTypes[i]) == "BikeLane" && GetType(rightTypes[i+1]) == "Empty") {
					roadSegmentInfo.CreateRoadElement(GetPrefab("WhiteLine"), .05 , "WhiteLine", offset, GetHeight(rightTypes[i]) + 0.001,"WhiteLine");
				} else if ((GetType(rightTypes[i]) == "Empty" && GetType(rightTypes[i+1]) == "BikeLane")) {
					roadSegmentInfo.CreateRoadElement(GetPrefab("WhiteLine"), .05 , "WhiteLine", offset, GetHeight(rightTypes[i+1]) + 0.001,"WhiteLine");
				}
			}
			offset += rightWidths[i];
		}
	}

	if(registerDatabase) {
		addDataToUserTable(unityName, isOneWay, numSegmentsLeft, leftTypes, leftWidths, numSegmentsRight, rightTypes, rightWidths, medianType, medianWidth);
	}
	
	roadSegmentInfo.isOneWay = isOneWay;
	roadSegmentInfo.numSegmentsLeft = numSegmentsLeft;
	roadSegmentInfo.leftTypes = new String[numSegmentsLeft];
	roadSegmentInfo.leftWidths = new float[numSegmentsLeft];
	for(i = 0; i<numSegmentsLeft; i++) {
		roadSegmentInfo.leftTypes[i] = leftTypes[i];
		roadSegmentInfo.leftWidths[i] = leftWidths[i];
	}
	roadSegmentInfo.numSegmentsRight = numSegmentsRight;
	roadSegmentInfo.rightTypes = new String[numSegmentsRight];
	roadSegmentInfo.rightWidths = new float[numSegmentsRight];
	for(i = 0; i<numSegmentsRight; i++) {
		roadSegmentInfo.rightTypes[i] = rightTypes[i];
		roadSegmentInfo.rightWidths[i] = rightWidths[i];
	}
	roadSegmentInfo.medianType = medianType;
	roadSegmentInfo.medianWidth = medianWidth;
	if(!onFirstCreation) {
		roadSegmentInfo.initialized = true;
	}
}

//Doesn't matter if it is one way or two way, we will still register everything; if one way, then just display leftwidths and leftTypes
public function LoadRoadSegment(dataString : String, registerDatabase : Boolean){
	
	try{
		var dataArray : String[] = dataString.Split(","[0]);

		var unityName : String = dataArray[0];
		var unityNameString : String[] = unityName.Split("_"[0]);

		var roadSegment : GameObject = GameObject.Find("Road Segments/"+unityName);

		var roadWidth : float = parseFloat(unityNameString[5]);
		//Check to see if it is One way or not
		var isOneWay : Boolean = (dataArray[1] == "0") ? false : true;

		var leftTypes : String[];
		var leftWidths : float[];
		var rightTypes : String[];
		var rightWidths : float[];

		var leftWidthsString : String[] = dataArray[4].Split("_"[0]);
		var rightWidthsString : String[] = dataArray[9].Split("_"[0]);

		leftTypes = new String[parseInt(dataArray[2])];
		leftWidths = new float[parseInt(dataArray[2])];
		for (var y = 0; y < parseInt(dataArray[2]); y++) {
			leftTypes[y] = DataParse.ConvertBetweenTypesAndCode(System.Convert.ToString((dataArray[3])[y]));
			leftWidths[y] = parseFloat(leftWidthsString[y]);
		}
		rightTypes = new String[parseInt(dataArray[7])];
		rightWidths = new float[parseInt(dataArray[7])];
		for (var z = 0; z < parseInt(dataArray[7]); z++) {
			rightTypes[z] = DataParse.ConvertBetweenTypesAndCode(System.Convert.ToString((dataArray[8])[z]));
			rightWidths[z] = parseFloat(rightWidthsString[z]);
		}
		UpdateRoadElements(roadSegment, isOneWay, roadWidth, parseInt(dataArray[2]), leftTypes, leftWidths, parseInt(dataArray[7]), rightTypes, rightWidths, dataArray[5], parseFloat(dataArray[6]), registerDatabase, false);
	}
	catch(e) {
		Debug.Log(e);
	}
}

// Hard Coded since this function runs every about 20 times every single frame. 
public function ReturnTexture(name: String, Road: String){
	if (Road == "Left"){
		if (name == "BikeLane") return texturesLeft[0];
		else if (name == "Bus Rapid Transit") return texturesLeft[1];
		else if (name == "Car") return texturesLeft[2];
		else if (name == "Light Rail Transit") return texturesLeft[3];
		else if (name == "Parking") return texturesLeft[4];
		else if (name == "Sidewalk") return texturesLeft[5];
		else if (name == "Separated Median") return texturesLeft[6];
		else if (name == "Light Truck") return texturesLeft[7];
		else if (name == "Heavy Truck") return texturesLeft[8];
		else if (name == "Green Space") return texturesLeft[9];
		else if (name == "Turning Lane") return texturesLeft[10];
		else if (name == "Black Rect") return texturesLeft[11];
		else if (name == "Yellow Rect") return texturesLeft[12];
		else if (name == "Green Rect") return texturesLeft[13];
		else if (name == "Blue Rect") return texturesLeft[14];
		else if (name == "Red Rect") return texturesLeft[15];
		
	}
	if (Road == "Right"){
		if (name == "BikeLane") return texturesRight[0];
		else if (name == "Bus Rapid Transit") return texturesRight[1];
		else if (name == "Car") return texturesRight[2];
		else if (name == "Light Rail Transit") return texturesRight[3];
		else if (name == "Parking") return texturesRight[4];
		else if (name == "Sidewalk") return texturesRight[5];
		else if (name == "Separated Median") return texturesRight[6];
		else if (name == "Light Truck") return texturesRight[7];
		else if (name == "Heavy Truck") return texturesRight[8];
		else if (name == "Green Space") return texturesRight[9];
		else if (name == "Turning Lane") return texturesRight[10];
		else if (name == "Black Rect") return texturesRight[11];
		else if (name == "Yellow Rect") return texturesLeft[12];
		else if (name == "Green Rect") return texturesLeft[13];
		else if (name == "Blue Rect") return texturesLeft[14];
		else if (name == "Red Rect") return texturesLeft[15];
	}
	if (Road == "Median") {
		if (name == "Painted Line") return texturesMedian[0];
		else if (name == "Turning Lane") return texturesMedian[1];
		else if (name == "Separated Median") return texturesMedian[2];
		else if (name == "Median Bus Rapid Transit") return texturesMedian[3];
		else if (name == "Median Light Rail Transit") return texturesMedian[4];
		else if (name == "Black Rect") return texturesMedian[5];
		else if (name == "Yellow Rect") return texturesMedian[6];
		else if (name == "Green Rect") return texturesMedian[7];
		else if (name == "Blue Rect") return texturesMedian[8];
		else if (name == "Red Rect") return texturesMedian[9];
	}
}

public function ReturnAccessoriesTexture( name : String ) {
	if (name == "boundaryIndicator") return accessoriesTexture[0];
}

public function addDataToUserTable(unityName: String, isOneWay: Boolean, numSegmentsLeft: int, leftTypes: String[], leftWidths: float[], numSegmentsRight: int , rightTypes: String[], rightWidths: float[], medianType: String, medianWidth: float) {

    //String order : unityName,isOneWay,NSL,LT,LW,NSR,RT,RW,MT,MW
    //Unity Name
    var appendString = unityName + ",";
    
    //Boolean of isOneWay
    if (isOneWay) appendString += "1";
    else appendString += "0";

    //Number of Left Segments
    appendString += "," + numSegmentsLeft.ToString();
    
    appendString += ",";
    
    //Left Types
    var leftTypeStrings : String;
    for(var i = 0; i < leftTypes.length; i++){
        leftTypeStrings += DataParse.ConvertBetweenTypesAndCode(leftTypes[i]);
    }
    appendString += leftTypeStrings;

    appendString += ",";

    //Left Width
    var leftWidthsStrings : String;
    for (i = 0 ; i < leftWidths.length; i++){
        leftWidthsStrings += leftWidths[i].ToString();
        if(i != leftWidths.length - 1){
            leftWidthsStrings += "_";
        }
    }
    appendString += leftWidthsStrings;

    //Median Type and Median Width
    appendString += "," + medianType + "," + medianWidth.ToString();

    //Number of Right Segments
    appendString += "," + numSegmentsRight.ToString();

    appendString += ",";

    //Right Types
    var rightTypeStrings : String;
    for(var j = 0; j < rightTypes.length; j++){
        rightTypeStrings += DataParse.ConvertBetweenTypesAndCode(rightTypes[j]);
    }
    appendString += rightTypeStrings;

    appendString += ",";

    //Right Width
    var rightWidthsStrings : String;
    for (i = 0 ; i < rightWidths.length; i++){
        rightWidthsStrings += rightWidths[i].ToString();
        if(i != rightWidths.length - 1){
            rightWidthsStrings += "_";
        }
    }
    appendString += rightWidthsStrings;

    gameObject.Find("DataHandler").GetComponent(UserDataBackend).LocalizedChangeListUpdate(unityName,appendString);
}












