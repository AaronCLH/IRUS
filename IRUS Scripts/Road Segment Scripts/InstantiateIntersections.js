#pragma strict

public var unityName : String;
public var onStart : Boolean = false;				// To prepare for populating variables
private var arcMap_XCoord : double;
private var arcMap_YCoord : double;
public var intersectionStreets : String[];
public var intersectionStreetsUnityName : String[];
public var numOfJunctions : int;

private var vertices : Vector3[];					// the vertices for the intersection polygon
private var edgesArray : Array;
private var centerPoint : Vector3;
private var variablesInitialized : Boolean = false;

public var kingStreet : Boolean = false;

function Awake () {
	SetIntersectionPropertiesFromName();
	var m : Mesh = gameObject.GetComponent(MeshFilter).mesh;
	vertices = m.vertices;
	edgesArray = new Array();
	createEdgesArray();
	onStart = true;
}

function SetIntersectionPropertiesFromName() {
	unityName = gameObject.name;
	var newTempString : String[] = gameObject.name.Split("_"[0]);

	for (var i = 0; i < newTempString.length; i++){
		//Here follows the naming convention order in the unity name
		if(i == 0){
			//ward number
		} else if(i == 1){
			//intersection 
		} else if(i == 2){
			arcMap_XCoord = double.Parse(newTempString[i]);
		} else if(i == 3){
			arcMap_YCoord = double.Parse(newTempString[i]);
		}
	}
}

/*
	return an array of edges for the intersection, however, not all of the edges are attached to street besides it
*/
private function createEdgesArray(){
	var p1: Vector3;
	var p2: Vector3;
	var l : Line;
	for (var i: int = 0; i < vertices.length; i++){
		centerPoint += gameObject.transform.TransformPoint(vertices[i]);
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
	centerPoint /= vertices.length;
}

/*
	The PopulateVariables function is usually called outside this script to populate the local variables.
	It contains the street names and unity names of the street attached to the intersection.
*/
public function PopulateVariables(streetsStrings : String, unityNamesStrings : String){
	var streets : String[] = streetsStrings.Split("_"[0]);
	var unityNames : String[] = unityNamesStrings.Split(";"[0]);
	intersectionStreets = new String[streets.length];
	intersectionStreetsUnityName = new String[unityNames.length];
	numOfJunctions = streets.length;
	for (var i = 0; i < streets.length; i++) {
		intersectionStreets[i] = streets[i];
		if(streets[i].Contains("KING")) {
			kingStreet = true;
		}
	}
	for (i = 0; i < unityNames.length; i++) {
		intersectionStreetsUnityName[i] = unityNames[i];
	}
	variablesInitialized = true;
}

/*
	The ModifyIntersection function is called to modify the elliptical curb on the coners of the intersection and the crosswalk.
	For the sidewalk:
	First, it finds the intersection points of the "edges" that are connected to a street.
	It then draws a circular disc on the intersection points.
	Lastly, it is scaled accordingly with the widths of the sidewalks.
	For the crosswalk:

*/
public function ModifyIntersection () {
	for(var child : Transform in gameObject.transform) {
		UnityEngine.Object.Destroy(child.gameObject);
	}
	var intersectionLineArray : Array = new Array();
	var sidewalkEndPoints : Hashtable = new Hashtable();
	var sidewalkEndPointsArray : Vector3[];
	var sideAorB : Boolean = false; // sideA true, sideB false
	// For the time being, we consider only the intersection on King Street and intersections with 4 streets attached
	if(numOfJunctions != 4 || !kingStreet) return false;
	Debug.Log("InstantiateIntersections log : Name of intersection being modified = " + unityName);

	for (var i = 0; i < intersectionStreetsUnityName.length; i++) {
		var roadSegmentInfo : InstantiateRoadElements = GameObject.Find("Road Segments/"+intersectionStreetsUnityName[i]).GetComponent(InstantiateRoadElements);
		var roadSegmentObjectVertices : Vector3[] = new Vector3[roadSegmentInfo.vertices.length];
		for(var j = 0; j < roadSegmentObjectVertices.length; j++) {
			roadSegmentObjectVertices[j] = gameObject.transform.TransformPoint(roadSegmentInfo.vertices[j]);
		}
		var twoPoints : Vector3[] = Line.WhichPointsClosest(centerPoint,2,roadSegmentObjectVertices) as Vector3[];
		var targetLine : Line = Line(twoPoints[0],twoPoints[1]);

		intersectionLineArray.Push(targetLine);
		sideAorB = false;
		//Since intersectionEndPointsA and intersectionEndPointsB should have the same number of elements, checking one of them is suffice
		if(roadSegmentInfo.intersectionEndPointsA.Count != 0 && roadSegmentInfo.intersectionEndPointsA.ContainsValue("Sidewalk")) {
			for(var k : DictionaryEntry in roadSegmentInfo.intersectionEndPointsA) {
				for( var m : DictionaryEntry in roadSegmentInfo.intersectionEndPointsB) {
					var testa : Vector3 = k.Key;
					var testb : Vector3 = m.Key;
					if(Line.PointLineDist(testa,(targetLine as Line)) <= Line.PointLineDist(testb,(targetLine as Line))) {
						sideAorB = true;
						break;
					}
				}
			}
		} else {
			//Debug.Log("InstantiateIntersections log : No sidewalk is contained for this road segment = " + roadSegmentInfo.unityName);
		}
		if(sideAorB) {
			for(var k : DictionaryEntry in roadSegmentInfo.intersectionEndPointsA) {
				if(k.Value == "Sidewalk") {
					sidewalkEndPoints[k.Key] = k.Value;
				}
			}
		} else {
			for(var k : DictionaryEntry in roadSegmentInfo.intersectionEndPointsB) {
				if(k.Value == "Sidewalk") {
					sidewalkEndPoints[k.Key] = k.Value;
				}
			}
		}
	}
	sidewalkEndPointsArray = new Vector3[sidewalkEndPoints.Count];
	sidewalkEndPoints.Keys.CopyTo(sidewalkEndPointsArray,0);

	intersectionLineArray = SortLinesInCyclicOrder(intersectionLineArray);

	var intersectionPoints : Vector3[] = new Vector3[intersectionLineArray.length];
	for(i = 0; i < intersectionPoints.length; i++) {
		if(i == intersectionPoints.length - 1) {
			intersectionPoints[i] = Line.LineIntersectionPoint(intersectionLineArray[i] as Line,intersectionLineArray[0] as Line);
		} else {
			intersectionPoints[i] = Line.LineIntersectionPoint(intersectionLineArray[i] as Line,intersectionLineArray[i+1] as Line);
		}
		intersectionPoints[i].y = 0.2; // To match the y axis of the road
	}

	for(i = 0; i < intersectionPoints.length; i++) {
		var endPoints : Vector3[] = Line.WhichPointsClosest(intersectionPoints[i],2,sidewalkEndPointsArray as Vector3[]) as Vector3[];

		var newObject: GameObject;
		newObject = Instantiate(GetPrefab("CircularCurb"), intersectionPoints[i], Quaternion.LookRotation(CreateNormalVector(endPoints[0],endPoints[1],intersectionPoints[i])));
		newObject.transform.parent = gameObject.transform;
		newObject.transform.localScale.z = (endPoints[0] - intersectionPoints[i]).magnitude * 2;
		newObject.transform.localScale.y = 0.165;
		newObject.transform.localScale.x = (endPoints[1] - intersectionPoints[i]).magnitude * 2;

		newObject.name = "intersectionSidewalk";

		var m : Mesh = newObject.GetComponent(MeshFilter).mesh;
	}
	DrawCrosswalk(intersectionLineArray);
	return true;
}

private function DrawCrosswalk(intersectionBoundaries : Array) {
	var newObject : GameObject;
	for(var crosswalk in intersectionBoundaries) {
		var crosswalkLength : float = (crosswalk as Line).length();
		var crosswalkVector : Vector3 = CreateCrosswalkVector((crosswalk as Line),centerPoint,0.75); //0.75 is half of the length of the crosswalk white line
		var crosswalkDirectionUnitVector : Vector3 = (crosswalk as Line).getDirection().normalized;
		var crosswalkOffset : Vector3 = (crosswalk as Line).getP2() + 0.1*crosswalkDirectionUnitVector; //0.1 is half of the width of the crosswalk white line
		var crosswalkOffsetLength : float = (crosswalkOffset - (crosswalk as Line).getP2()).magnitude;
		while(crosswalkOffsetLength <= crosswalkLength){
			if(crosswalkLength - crosswalkOffsetLength <= 0.2 + 0.5) {
				break;
			}
			newObject = Instantiate(GetPrefab("DottedWhiteLine"), crosswalkOffset - crosswalkVector, Quaternion.LookRotation(crosswalkVector));
			newObject.transform.parent = gameObject.transform;
			newObject.transform.localScale.z = 1.5;
			newObject.transform.localScale.y = 0.01;
			newObject.transform.localScale.x = 0.2;

			crosswalkOffset += 0.7*crosswalkDirectionUnitVector;
			crosswalkOffsetLength = (crosswalkOffset - (crosswalk as Line).getP2()).magnitude;
		}
	}
}

/*
	In this script, the GetPrefab is mainly used to grab the circular disc and the crosswalk
*/
function GetPrefab( type : String){
	
	for (var gm: GameObject in gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementPrefabs){
		if (gm.name == type) return gm;
	}
	return null;
}

private function CreateNormalVector(p1 : Vector3, p2 : Vector3, outerVector : Vector3) {
	p1.y = 0.2;
	p2.y = 0.2;
	outerVector.y = 0.2;
	//var line : Line = Line(p1,p2);
	return (p1 - outerVector);
}

private function CreateCentripetalVector(line : Line, centerPt : Vector3, mag : float){
	var perp = (line as Line).getCenter() - centerPt;
	perp.Normalize();
	perp *= mag;
	return perp;
}

private function CreateCrosswalkVector(line : Line, centerPt : Vector3, mag : float) {
	var vt : Vector3 = (line as Line).getDirection();
	var perp : Vector3 = (Line.WhichPointsCloser(centerPt,(line as Line).getCenter() - Vector3(vt.z, 0, -vt.x),(line as Line).getCenter() - Vector3(-vt.z, 0, vt.x))==(line as Line).getCenter() - Vector3(vt.z, 0, -vt.x)) ? Vector3(vt.z, 0, -vt.x) : Vector3(-vt.z, 0, vt.x);
	perp.Normalize();
	perp *= mag;
	return perp;
}

private function CreateDirectionalUnitVector(vt: Vector3, mag: float) {
	var vector : Vector3 = Vector3(vt.x, 0, vt.z);
	vector.Normalize();
	vector *= mag;
	return vector;
}

function SortLinesInCyclicOrder(refArray : Array) {
	if(refArray.length <= 1) {
		return refArray;
	}
	var maxIndex : int = refArray.length;
	var returnArray : Array = new Array();
	var currentLine : Line = refArray.Pop() as Line;
	returnArray.Push(currentLine);
	var currentPoint : Vector3 = (currentLine as Line).getP1();
	for(var i = 1; i < maxIndex; i++) {
		var nextLine : Line = refArray[0] as Line;
		var minimumDist : float = Line.PointLineDist(currentPoint,refArray[0] as Line);
		var indexToRemove : int = 0;
		for(var j = 1; j < refArray.length; j++) {
			var testDist : float = Line.PointLineDist(currentPoint,refArray[j] as Line);
			if(minimumDist > testDist) {
				minimumDist = testDist;
				nextLine = refArray[j] as Line;
				indexToRemove = j;
			}
		}
		refArray.RemoveAt(indexToRemove);
		returnArray.Push(nextLine);
		currentPoint = Line.WhichPointsFurther(currentPoint,(nextLine as Line).getP1(),(nextLine as Line).getP2());
	}
	return returnArray;
}






