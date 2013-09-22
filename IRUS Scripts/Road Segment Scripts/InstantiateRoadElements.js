

#pragma strict

		// The height of the lotline visualizations

public var freeWallPrefab : GameObject;		
public var occupiedWallPrefab : GameObject;	
public var vertices : Vector3[];				// The vertices of this parcel's mesh
public var edgesArray : Array;	
public var filteredEdgesArray : Array;			// The sorted Version of the edges array
public var intersectionEndPointsA : Hashtable = new Hashtable();	// one side of the road {(point position),(type)} used for drawing the intersection
public var intersectionEndPointsB : Hashtable = new Hashtable();	// another side of the road {(point position),(type)} used for drawing the intersection
private var centerPoint : Vector3;
private var uiAccessor : UIControl;				// You know what it is

public var unityName : String;
public var roadPIN : String;
public var roadWidth : float;

public var wardNum : int;
public var ward2010 : String;

public var objectId : int;
public var objectType : String;

public var arcMap_XCoord : double;
public var arcMap_YCoord : double;

public var jurisdiction : String;
public var streetClass : streetClassType;
public var streetName : String;
public var connectionStart : connectionType;
public var connectionEnd : connectionType;

public var toStreet : String;
public var fromStreet : String;

public var intersectionConnected : String;

public var initialized : Boolean = false;

public enum connectionType {
	Street,
	Crossing,
	DeadEnd,
	Roundabout
}

public enum streetClassType {
	CityRoad,
	MajorCollector,
	MinorCollector,
	RegionalArterial,
	Private,
	ExpressWay,
	CityArterial
}

public var isOneWay : Boolean;
public var numSegmentsLeft : int;
public var leftTypes : String[];
public var leftWidths : float[];
public var numSegmentsRight : int;
public var rightTypes : String[];
public var rightWidths : float[];
public var medianType : String;
public var medianWidth : float;

// Urban Design Objects related variable
public var containPresetSidewalkLeft : Boolean = false;
public var containPresetSidewalkRight : Boolean = false;
public var containUserDataSidewalkLeft : Boolean = false;
public var containUserDataSidewalkRight : Boolean = false;

// The ratio should add up to one
public var femalePedestrianRatio : float = 0.4;
public var malePedestrianRatio : float = 0.4;
public var seniorPedestrianRatio : float = 0.2;
public var numPedestrian : int = 3;

public var kingStreet : Boolean = false;

private var streetNamePattern = new Regex("/\b([a-z])");

function Awake() {
	var m : Mesh = gameObject.GetComponent(MeshFilter).mesh;
	vertices = m.vertices;
	edgesArray = new Array();
	filteredEdgesArray = new Array();

	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl); // In the jungle, the mighty jungle, the lion sleeps tonight
	SetRoadPropertiesFromName();
	createEdgesArray();
	FilterEdgesArray();
}

// This function calculates the lotines and sizes the freeWallPrefabs and occupiedWallPrefabs to fit on the lotlines.
public function CreateRoadElement (prefabObject : GameObject, objWidth : float, objectHolderName : String, offsetx : float, objHeight : float, objName : String){
	/*
		This part goes through the edges and checks if it is along the road (ie. The road width is not equal to the edge width)
		and adds the prefab object a certain distance away from the edge. 
		The gameObject is given the tag "Side1" until the first edge that has width as the width of the road is found.
		Then the next gameObject is given the tag "Side2" and this is reversed after
	*/
	var objectHolder: GameObject = new GameObject ();
	objectHolder.name = objectHolderName;
	objectHolder.transform.parent = gameObject.transform;
	var newObject: GameObject;
	for (var i: int = 0; i < filteredEdgesArray.length; i++){
		var l: Line = (filteredEdgesArray[i] as Line);
		var centre = l.getCenter();
		var pos: Vector3 = centre + CreateOffsetVector(l.getDirection(), offsetx + objWidth / 2);
		var tilingY : float;
		if (prefabObject.name.Contains("Dotted")) {
			var lineLength : float = l.length();
			var lineDirectionUnitVector : Vector3 = l.getDirection().normalized;
			var lineOffset : Vector3 = l.getP2() + CreateOffsetVector(l.getDirection(), offsetx + objWidth / 2) + lineDirectionUnitVector; //0.1 is half of the width of the crosswalk white line
			var lineOffsetLength : float = (lineOffset - (l.getP2()+ CreateOffsetVector(l.getDirection(), offsetx + objWidth / 2))).magnitude;
			while(lineOffsetLength <= lineLength){
				if(lineLength - lineOffsetLength <= 0.5) {
					break;
				}
				newObject = Instantiate(prefabObject, lineOffset, Quaternion.LookRotation(l.getDirection()));
				newObject.transform.parent = objectHolder.transform;
				newObject.transform.localScale.z = 1;
				newObject.transform.localScale.y = objHeight;
				newObject.transform.localScale.x = objWidth;

				lineOffset += 2*lineDirectionUnitVector;
				lineOffsetLength = (lineOffset - (l.getP2()+ CreateOffsetVector(l.getDirection(), offsetx + objWidth / 2))).magnitude;
			}
		} else {
			newObject = Instantiate(prefabObject, pos, Quaternion.LookRotation(l.getDirection()));
			if (prefabObject.name == "TurningLane") {
				tilingY = l.length()/25;
				if (tilingY < 1) tilingY = 1;
				newObject.renderer.materials[0].mainTextureScale = Vector2(1,tilingY);
				//Debug.Log("newObject.materials = "+ newObject.renderer.materials[0].GetTextureScale("_MainTex"));
			} else if (prefabObject.name == "BikeLane") {
				tilingY = l.length()/20;
				if (tilingY < 1) tilingY = 1;
				newObject.renderer.materials[0].mainTextureScale = Vector2(1,tilingY);
			}
			newObject.transform.localScale.z = l.getDirection().magnitude;
			newObject.transform.localScale.y = objHeight;
			newObject.transform.localScale.x = objWidth;
			newObject.transform.parent = objectHolder.transform;
			if (prefabObject.name == "Sidewalk") {
				newObject.transform.parent = gameObject.transform;
				Destroy(objectHolder);
				newObject.name = objName;
				newObject.tag = "sidewalk";
				if(Mathf.Approximately(offsetx, 0.0)) {
					offsetx += objWidth;
				}
				var pointA : Vector3 = (l.getP1()+CreateOffsetVector(l.getDirection(),offsetx));
				var pointB : Vector3 = (l.getP2()+CreateOffsetVector(l.getDirection(),offsetx));
				intersectionEndPointsA[pointA] = "Sidewalk";
				intersectionEndPointsB[pointB] = "Sidewalk";
				newObject.AddComponent(Group);
				var userDataBackend : UserDataBackend = GameObject.Find("DataHandler").GetComponent(UserDataBackend);
				if(newObject.name == "SidewalkLeft") {
					if(containUserDataSidewalkLeft) {
						userDataBackend.ApplyUserUrbanDesignObjectsChanges(unityName + "~SidewalkLeft",newObject,wardNum.ToString());
						userDataBackend.UrbanDesignLocalizedChangeListUpdate(unityName + "~SidewalkLeft",userDataBackend.RetrieveLastUrbanDesignChange(unityName + "~SidewalkLeft"));
					} else if (containPresetSidewalkLeft) {
						userDataBackend.RestoreDefaultUrbanDesignObjects(unityName + "~SidewalkLeft",newObject,wardNum.ToString());
						
					}
				} else if (newObject.name == "SidewalkRight") {
					//
					if(containUserDataSidewalkRight) {
						userDataBackend.ApplyUserUrbanDesignObjectsChanges(unityName + "~SidewalkRight",newObject,wardNum.ToString());
						userDataBackend.UrbanDesignLocalizedChangeListUpdate(unityName + "~SidewalkRight",userDataBackend.RetrieveLastUrbanDesignChange(unityName + "~SidewalkLeft"));
					} else if (containPresetSidewalkRight) {
						userDataBackend.RestoreDefaultUrbanDesignObjects(unityName + "~SidewalkRight",newObject,wardNum.ToString());
					}
				}

				var sidewalkVertices : Array = new Array();
				sidewalkVertices.Push(pointA);
				sidewalkVertices.Push(pointB);
				var modifiedVertices : Vector3[] = new Vector3[vertices.length];
				for(var k = 0; k < vertices.length; k++) {
					modifiedVertices[k] = gameObject.transform.TransformPoint(vertices[k]);
				}
				sidewalkVertices.Push(Line.WhichPointsClosest(pointA,1,modifiedVertices));
				sidewalkVertices.Push(Line.WhichPointsClosest(pointB,1,modifiedVertices));

				sidewalkVertices = sidewalkVertices.ToBuiltin(Vector3) as Vector3[]; // To builtin array for efficiency
				var p1: Vector3;
				var p2: Vector3;
				var sidewalkLine : Line;
				var sidewalkEdges : Array = new Array();
				for (var j = 0; j < sidewalkVertices.length; j++){
					if ( j + 1 == sidewalkVertices.length){
						p1 = sidewalkVertices[j];
						p2 = sidewalkVertices[0];
					}
					else {
						p1 = sidewalkVertices[j];
						p2 = sidewalkVertices[j+1];
					}
					p1.y *= 2;
					p2.y *= 2;
					sidewalkLine = new Line(p1, p2);
					sidewalkEdges.Push(sidewalkLine);
				}
				if(kingStreet) {
					var elevatedPosition : Vector3 = newObject.transform.position;
					elevatedPosition.y *= 2;
					CreatePedestrian(elevatedPosition,sidewalkEdges,numPedestrian);
				}
			} else if (prefabObject.name == "YellowLine" || prefabObject.name == "TurningLane" || prefabObject.name == "SeparatedMedian" || prefabObject.name == "Double BRTLane" || prefabObject.name == "Double LRTLine") {
				newObject.tag = "median";
				pointA = (l.getP1()+CreateOffsetVector(l.getDirection(),offsetx));
				pointB = (l.getP2()+CreateOffsetVector(l.getDirection(),offsetx));
				intersectionEndPointsA[pointA] = "Median";
				intersectionEndPointsB[pointB] = "Median";
			} else if (prefabObject.name == "LRTLine" || prefabObject.name == "BRTLane") {
				newObject.tag = "traffic";
			} else if (prefabObject.name == "Parking" || prefabObject.name == "BikeLane" || prefabObject.name == "Buffer") {
				newObject.tag = "curbside";
			}
		}
	}
	return;
}

private function CreateOffsetVector(vt: Vector3, mag:float){
	var perp = Vector3(vt.z, 0, -vt.x);
	perp.Normalize();
	perp *= mag;
	return perp;
}
	
private function createEdgesArray(){
	var p1: Vector3;
	var p2: Vector3;
	var l : Line;
	for (var i: int = 0; i < vertices.length; i++){
		if ( i + 1 == vertices.length){
			p1 = gameObject.transform.TransformPoint(vertices[i]);
			p2 = gameObject.transform.TransformPoint(vertices[0]);
		}
		else {
			p1 = gameObject.transform.TransformPoint(vertices[i]);
			p2 = gameObject.transform.TransformPoint(vertices[i+1]);
		}
		l = new Line(p1, p2);
		edgesArray.Push(l);
	}
}	

// Sets the width and PIN properties for the road Segment
private function SetRoadPropertiesFromName(){
	
	var roadWidthString: String = gameObject.name;
	var newTempString : String[] = roadWidthString.Split("_"[0]);
	var tempString: String = "";
	for (var j = 12; j < roadWidthString.length ; j++){
		if (roadWidthString[j] == '_') break;
		tempString += roadWidthString[j];
	}
	roadWidth = parseFloat(newTempString[5]);
	unityName = roadWidthString;

	for (var i = 0; i < newTempString.length; i++){
		//Here follows the naming convention order in the unity name
		if(i == 0){
			wardNum = parseInt(newTempString[i]);
		} else if(i == 1){
			objectType = newTempString[i];
		} else if(i == 2){
			roadPIN = newTempString[i];
		} else if(i == 3){
			arcMap_XCoord = double.Parse(newTempString[i]);
		} else if(i == 4){
			arcMap_YCoord = double.Parse(newTempString[i]);
		} else if(i == 5){
			roadWidth = parseFloat(newTempString[i]);
		}
	}
	return;
}

private function FilterEdgesArray(){
	var shouldBeKept: Boolean = false;
	var count : int = 0;
	for (var l in edgesArray){
		if (Math.Abs((l as Line).length() - roadWidth) <= 0.1){
			if (shouldBeKept) shouldBeKept = false;
			else shouldBeKept = true;
		}
		else if (shouldBeKept){
			filteredEdgesArray.Push(l);
			count++;
		}
	}
	return;
}			

/*		
private function GetDimensions( gm: GameObject){
	var filters = gm.GetComponentsInChildren(MeshFilter);
	// Make sure you Update THIS if your world is expanded!!! THESE
	// Are just arbritrary values
	var low = Vector3(10000000,1000000,1000000);
	var high = Vector3(-1000000, -1000000,-1000000);
	for (var filter : MeshFilter in filters){
		low.x = Mathf.Min(low.x, filter.mesh.bounds.min.x); 
		low.y = Mathf.Min(low.y, filter.mesh.bounds.min.y);
		low.z = Mathf.Min(low.z, filter.mesh.bounds.min.z);
		high.x = Mathf.Max(high.x, filter.mesh.bounds.max.x);
		high.y = Mathf.Max(high.y, filter.mesh.bounds.max.y);
		high.z = Mathf.Max(high.z, filter.mesh.bounds.max.z);
		}
	var boundingBox: Vector3 = high - low;
	boundingBox.x *= gm.transform.localScale.x;
	boundingBox.y *= gm.transform.localScale.y;
	boundingBox.z *= gm.transform.localScale.z;
	return boundingBox;
}
*/

public function PopulateVariables(variableData : String, index : int){
	// index should be corresponding to the order of fields in the database table
	//Debug.Log("PopulateVariables log: variableData = " + variableData);
	if(index == 0) {
		unityName = variableData;
	} else if(index == 1) {
		objectId = parseInt(variableData);
	} else if(index == 2) {
		wardNum = parseInt(variableData);
	} else if(index == 3) {
		ward2010 = variableData;
	} else if(index == 4) {
		objectType = variableData;
	} else if(index == 5) {
		roadPIN = variableData;
	} else if(index == 6) {
		arcMap_XCoord = double.Parse(variableData);
	} else if(index == 7) {
		arcMap_YCoord = double.Parse(variableData);
	} else if(index == 8) {
		jurisdiction = variableData;
	} else if(index == 9) {
		if(variableData == "CITY ROAD"){
			streetClass = streetClassType.CityRoad;
		} else if(variableData == "MAJOR COLLECTOR"){
			streetClass = streetClassType.MajorCollector;
		} else if(variableData == "MINOR COLLECTOR"){
			streetClass = streetClassType.MinorCollector;
		} else if(variableData == "REGIONAL ARTERIAL"){
			streetClass = streetClassType.RegionalArterial;
		} else if(variableData == "PRIVATE"){
			streetClass = streetClassType.Private;
		} else if(variableData == "EXPRESSWAY"){
			streetClass = streetClassType.ExpressWay;
		} else if(variableData == "CITY ARTERIAL"){
			streetClass = streetClassType.CityArterial;
		} else {
			Debug.Log("InstantiateRoadElements log: streetClassType not available!");
		}
	} else if(index == 10) {
		streetName = variableData;
		if(streetName.Contains("KING")) {
			kingStreet = true;
		}
	} else if(index == 11) {
		roadWidth = parseFloat(variableData);
	} else if(index == 12) {
		if(variableData == "STREET"){
			connectionStart = connectionType.Street;
		} else if(variableData == "CROSSING"){
			connectionStart = connectionType.Crossing;
		} else if(variableData == "DEAD_END"){
			connectionStart = connectionType.DeadEnd;
		} else if(variableData == "ROUNDABOUT"){
			connectionStart = connectionType.Roundabout;
		} else {
			Debug.Log("InstantiateRoadElements log: connectionType not available!");
		}
	} else if(index == 13) {
		if(variableData == "STREET"){
			connectionEnd = connectionType.Street;
		} else if(variableData == "CROSSING"){
			connectionEnd = connectionType.Crossing;
		} else if(variableData == "DEAD_END"){
			connectionEnd = connectionType.DeadEnd;
		} else if(variableData == "ROUNDABOUT"){
			connectionEnd = connectionType.Roundabout;
		} else {
			Debug.Log("InstantiateRoadElements log: connectionType not available!");
		}
	} else if(index == 14) {
		toStreet = variableData;
	} else if(index == 15) {
		fromStreet = variableData;
	} else if(index == 16) {
		intersectionConnected = variableData;
	}

	/*
		php	->	'UNITY_NAME'	'OBJECTID'	'WARD_NO'	'WARD_2010'	'OBJ_TYPE'	'PIN'
				..->	'X_COORD'	'Y_COORD'	'JURISDICTI'	'STREET_CLA'	'STREET_NAM'
				..->	'strtWdth'	'cnnctnStrt'	'cnnctnnd'


	*/
}

public function PopulateUserData (dataString : String) {
	try {
		//var backend = gameObject.Find("RoadHandler").GetComponent(RoadsBackend);
		var dataArray = dataString.Split(","[0]);
		for (var index = 0; index < dataArray.length; index++) {
			var variableData : String = dataArray[index];
			if(index == 1) {
				isOneWay = (variableData == "0") ? false : true;
			} else if (index == 2) {
				numSegmentsLeft = parseInt(variableData);
			} else if (index == 3) {
				leftTypes = new String[variableData.length];
				for(var i = 0; i < variableData.length; i++) {
					leftTypes[i] = DataParse.ConvertBetweenTypesAndCode(System.Convert.ToString(variableData[i]));
				}
			} else if (index == 4) {
				var leftWidthsString : String[] = variableData.Split("_"[0]);
				leftWidths = new float[leftWidthsString.length];
				for(var j = 0; j < leftWidthsString.length; j++) {
					leftWidths[j] = parseFloat(leftWidthsString[j]);
				}
			} else if (index == 5) {
				medianType = variableData;
			} else if (index == 6) {
				medianWidth = parseFloat(variableData);
			} else if (index == 7) {
				numSegmentsRight = parseInt(variableData);
			} else if (index == 8) {
				rightTypes = new String[variableData.length];
				for(var k = 0; k < variableData.length; k++) {
					rightTypes[k] = DataParse.ConvertBetweenTypesAndCode(System.Convert.ToString(variableData[k]));
				}
			} else if (index == 9) {
				var rightWidthsString : String[] = variableData.Split("_"[0]);
				rightWidths = new float[rightWidthsString.length];
				for(var l = 0; l < rightWidthsString.length; l++) {
					rightWidths[l] = parseFloat(rightWidthsString[l]);
				}
			}
		}
		initialized = true;
	}
	catch(e) {
		Debug.Log(e);
	}
}

public function CreatePedestrian(creationPosition : Vector3, patrolLine : Array, number : int) {
	if(!Mathf.Approximately(femalePedestrianRatio+malePedestrianRatio+seniorPedestrianRatio,1.0)) {
		Debug.Log("InstantiateRoadElements log : Ratio of pedestrian is now " + Mathf.Approximately(femalePedestrianRatio+malePedestrianRatio+seniorPedestrianRatio,1.0));
		Debug.Log("InstantiateRoadElements log : Pedestrian ratio of "+unityName+" is not equal to one, setting the respective ratio be 4:4:2");
		Debug.Log("InstantiateRoadElements log : female : " + Mathf.Round(numPedestrian*femalePedestrianRatio));
		Debug.Log("InstantiateRoadElements log : male : " + Mathf.Round(numPedestrian*malePedestrianRatio));
		Debug.Log("InstantiateRoadElements log : senior : " + Mathf.Round(numPedestrian*seniorPedestrianRatio));
		femalePedestrianRatio = 0.4;
		malePedestrianRatio = 0.4;
		seniorPedestrianRatio = 0.2;
	}
	gameObject.Find("/AvatarHandler").GetComponent(AvatarManager).CreatePedestrian(unityName,creationPosition,patrolLine,number,femalePedestrianRatio,malePedestrianRatio,seniorPedestrianRatio);
}

function GetPrefab( type : String){
	
	for (var gm: GameObject in gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementPrefabs){
		if (gm.name == type) return gm;
	}
	return null;
}







