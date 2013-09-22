#pragma strict

//====================================================================================================
// Constants
//====================================================================================================
// in metres
static var SIDEROAD_SIDEWALK_MAX : float = 3.0;
static var MAINROAD_SIDEWALK_MAX : float = 5.0;
static var SIDEROAD_SIDEWALK_MIN : float = 1.0;
static var MAINROAD_SIDEWALK_MIN : float = 2.0;
static var SIDEROAD_SIDEWALK_INIT : float = 1.0;
static var MAINROAD_SIDEWALK_INIT : float = 2.0;

static var SCRIPT_HOST : String = "First Person Controller";

public var sidewalksCornersParent : GameObject;
//====================================================================================================
// Variable Declaration
//====================================================================================================
static var areas : Area[];
//====================================================================================================
// GameObject variables (require us to initialize from the inspector)
//====================================================================================================
// Filler objects
public var fillerObjects : GameObject[];
// Corner objects
public var cornerObjects : GameObject[];
// The following are the sidewalk objects
// They are manually positioned
// They also determine the positions of the fillers and the corners
public var s0_0 : GameObject;
public var s0_1 : GameObject;
public var s0_2 : GameObject;
public var s0_3 : GameObject;
public var s1_0 : GameObject;
public var s1_1 : GameObject;
public var s1_2 : GameObject;
public var s1_3 : GameObject;
public var s2_0 : GameObject;
public var s2_1 : GameObject;
public var s2_2 : GameObject;
public var s2_3 : GameObject;
public var s3_0 : GameObject;
public var s3_1 : GameObject;
public var s3_2 : GameObject;
public var s3_3 : GameObject;
public var s4_0 : GameObject;
public var s4_1 : GameObject;
public var s4_2 : GameObject;
public var s4_3 : GameObject;
public var s5_0 : GameObject;
public var s5_1 : GameObject;
public var s5_2 : GameObject;
public var s5_3 : GameObject;


class Side {
	var sidewalk : GameObject;
	var sidewalkMeshWidth : float;
	var sidewalkWidth : float;
	var corner : GameObject;
	var cornerWidth : float;
	var shortFiller : GameObject;
	var shortFillerMeshThickness : float;
	var shortFillerThickness : float;
	var longFiller : GameObject;
	var longFillerMeshThickness : float;
	var longFillerMeshWidth : float;
	var longFillerThickness : float;
	var longFillerWidth : float;
	var pivotPosition : Vector3;
	var clockwiseNext : Side;
	var clockwisePrevious : Side;
	var correspondingRoadSegment : RoadSegment;
	private var sideRoadSide : boolean;
	function Side (swalk : GameObject, cner : GameObject, sfler : GameObject, lfler : GameObject) {
		var e : Vector3;
		var tempSidewalk : Sidewalk;
		
		sidewalk = swalk;
		swalk.AddComponent(Group);
		tempSidewalk = swalk.AddComponent(Sidewalk);
		tempSidewalk.setSide(this);
		e = swalk.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.extents;
		sidewalkMeshWidth = 2*e.z;
		sidewalkWidth = sidewalkMeshWidth * swalk.transform.localScale.z;
		
		corner = cner;
		e = cner.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.extents;
		cornerWidth = 2*e.x * cner.transform.localScale.x;
		
		shortFiller = sfler;
		e = sfler.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.extents;
		shortFillerMeshThickness = 2*e.x;
		shortFillerThickness = shortFillerMeshThickness * sfler.transform.localScale.x;
		shortFiller.transform.localScale.z = cornerWidth/(2*e.z);
		
		longFiller = lfler;
		e = lfler.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.extents;
		longFillerMeshThickness = 2*e.x;
		longFillerMeshWidth = 2*e.z;
		longFillerThickness = longFillerMeshThickness * lfler.transform.localScale.x;
		longFillerWidth = longFillerMeshWidth * lfler.transform.localScale.z;
		
		pivotPosition = swalk.transform.position;
		sideRoadSide = true; // default
	}
	public function setNext (sc : Side) {
		clockwiseNext = sc;
	}
	public function setPrevious (sc : Side) {
		clockwisePrevious = sc;
	}
	private function setShortFillerThickness (thickness : float) {
		shortFiller.transform.localScale.x = -thickness/shortFillerMeshThickness;
		shortFillerThickness = thickness;
	}
	private function setLongFillerThickness (thickness : float) {
		longFiller.transform.localScale.x = -thickness/longFillerMeshThickness;
		longFillerThickness = thickness;
	}
	private function setLongFillerWidth (width : float) {
		longFiller.transform.localScale.z = width/longFillerMeshWidth;
		longFillerWidth = width;
	}
	public function getSidewalkWidth () {
		return sidewalkWidth;
	}
	public function setToBeBySideRoad () {
		sideRoadSide = true;
		setSidewalkWidth(SidewalkManager.SIDEROAD_SIDEWALK_INIT);
	}
	public function setToBeByMainRoad () {
		sideRoadSide = false;
		setSidewalkWidth(SidewalkManager.MAINROAD_SIDEWALK_INIT);
	}
	public function isBySideRoad () {
		return sideRoadSide;
	}
	public function isByMainRoad () {
		return (!sideRoadSide);
	}
	public function adjustFillers () {
		var previousSidewalkWidth : float = clockwisePrevious.getSidewalkWidth();
		setLongFillerWidth(previousSidewalkWidth);
		setLongFillerThickness(sidewalkWidth - cornerWidth);
		setShortFillerThickness(previousSidewalkWidth - cornerWidth);
		shortFiller.transform.position = sidewalk.transform.position + shortFiller.transform.rotation*Vector3(0,0,-longFillerThickness);
		corner.transform.position = sidewalk.transform.position + corner.transform.rotation*Vector3(-longFillerThickness,0,-shortFillerThickness);
	}
	public function setSidewalkWidth (width : float) {
		sidewalk.transform.localScale.z = width/sidewalkMeshWidth;
		sidewalkWidth = width;
		adjustFillers();
		clockwiseNext.adjustFillers();
		if (clockwisePrevious.correspondingRoadSegment){
			clockwisePrevious.correspondingRoadSegment.sideOne.corner.GetComponent(Crosswalk).updateCrosswalk();
			clockwisePrevious.correspondingRoadSegment.sideTwo.corner.GetComponent(Crosswalk).updateCrosswalk();
		}
		if (clockwiseNext.corner.GetComponent(Crosswalk)){
			clockwiseNext.corner.GetComponent(Crosswalk).updateCrosswalk();
		}
	}
	public function setRoadSegment (rs : RoadSegment) {
		correspondingRoadSegment = rs;
	}
}

class Area {
	var sides : Side[];
	var numSide : int;
	function Area (swalks : GameObject[], cners : GameObject[], sflers : GameObject[], lflers : GameObject[], aLength : int) {
		numSide = aLength;
		sides = new Side[aLength];
		for (var i : int = 0; i < aLength; i++) {
			sides[i] = new Side(swalks[i], cners[i], sflers[i], lflers[i]);
		}
		for (i = 0; i < aLength; i++) {
			sides[i].setNext(sides[(i+1) % aLength]);
		}
		for (i = 0; i < aLength; i++) {
			sides[(i+1) % aLength].setPrevious(sides[i]);
		}
	}
	function reAdjust () {
		for (var sc : Side in sides) {
			sc.setSidewalkWidth(sc.getSidewalkWidth());
		}
	}
}

function Awake () {
	
	var NUM_AREAS : int = 6;
	
	var tempSidewalks = MultiDim.GameObjectArray(10,10);
	var tempCorners = MultiDim.GameObjectArray(10,10);
	var tempFillers = MultiDim.GameObjectArray(40,2);
	
	// spawn sidewalks to their prefab location
	tempSidewalks[0,0]=Instantiate(s0_0);
	tempSidewalks[0,1]=Instantiate(s0_1);
	tempSidewalks[0,2]=Instantiate(s0_2);
	tempSidewalks[0,3]=Instantiate(s0_3);
	
	tempSidewalks[1,0]=Instantiate(s1_0);
	tempSidewalks[1,1]=Instantiate(s1_1);
	tempSidewalks[1,2]=Instantiate(s1_2);
	tempSidewalks[1,3]=Instantiate(s1_3);
	
	tempSidewalks[2,0]=Instantiate(s2_0);
	tempSidewalks[2,1]=Instantiate(s2_1);
	tempSidewalks[2,2]=Instantiate(s2_2);
	tempSidewalks[2,3]=Instantiate(s2_3);
	
	tempSidewalks[3,0]=Instantiate(s3_0);
	tempSidewalks[3,1]=Instantiate(s3_1);
	tempSidewalks[3,2]=Instantiate(s3_2);
	tempSidewalks[3,3]=Instantiate(s3_3);
	
	tempSidewalks[4,0]=Instantiate(s4_0);
	tempSidewalks[4,1]=Instantiate(s4_1);
	tempSidewalks[4,2]=Instantiate(s4_2);
	tempSidewalks[4,3]=Instantiate(s4_3);
	
	tempSidewalks[5,0]=Instantiate(s5_0);
	tempSidewalks[5,1]=Instantiate(s5_1);
	tempSidewalks[5,2]=Instantiate(s5_2);
	tempSidewalks[5,3]=Instantiate(s5_3);
	
	// Spawn the corners for NUM_AREAS areas on the location (pivot position) of the sidewalks
	for (var i : int = 0; i < NUM_AREAS; i++) {
		for (var j : int = 0; j < 4; j++) {
			tempCorners[i,j] = Instantiate(cornerObjects[j]);
			tempCorners[i,j].transform.position = tempSidewalks[i,j].transform.position;
			tempCorners[i,j].transform.parent = sidewalksCornersParent.transform;
			tempSidewalks[i,j].transform.parent = sidewalksCornersParent.transform;
		}
	}
	
	// Spawn the filler rectangles on the location (pivot position) of the corners
	for (i = 0; i < NUM_AREAS; i++) {
		for (j = 0; j < 4; j++) {
			for (var k : int = 0; k < 2; k++) {
				tempFillers[j+4*i,k] = Instantiate(fillerObjects[2*j+k]);
				tempFillers[j+4*i,k].transform.position = tempCorners[i,j].transform.position;
				tempFillers[j+4*i,k].transform.parent = sidewalksCornersParent.transform;
			}
		}
	}
	
	areas = new Area[NUM_AREAS];
	for (i = 0; i < NUM_AREAS; i++) {
		var swalks : GameObject[] = [tempSidewalks[i,0], tempSidewalks[i,1], tempSidewalks[i,2], tempSidewalks[i,3]];
		var cners : GameObject[] = [tempCorners[i,0], tempCorners[i,1], tempCorners[i,2], tempCorners[i,3]];
		var sflers : GameObject[] = [tempFillers[0+4*i,0], tempFillers[1+4*i,0], tempFillers[2+4*i,0], tempFillers[3+4*i,0]];
		var lflers : GameObject[] = [tempFillers[0+4*i,1], tempFillers[1+4*i,1], tempFillers[2+4*i,1], tempFillers[3+4*i,1]];
		areas[i] = new Area(swalks, cners, sflers, lflers, 4);
		areas[i].reAdjust();
		ResetWidth(areas[i].sides[0]);
		ResetWidth(areas[i].sides[1]);
		ResetWidth(areas[i].sides[2]);
		ResetWidth(areas[i].sides[3]);
	}
}

// reset to initial width
static function ResetWidth (s : Side) {
	if (s.isBySideRoad()) {
		s.setSidewalkWidth(SIDEROAD_SIDEWALK_INIT);
	} else {
		s.setSidewalkWidth(MAINROAD_SIDEWALK_INIT);
	}
	if (s.correspondingRoadSegment != null) { // sidewalk is by a road
		s.correspondingRoadSegment.resetLanes(); // reset the lanes
	}
}


// for debug use	
function drawBounds (g : GameObject) {
	var p : Vector3[] = new Vector3[8];
	var e : Vector3 = g.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.extents;
	p[0] = new Vector3(e.x, e.y, e.z);
	p[1] = new Vector3(e.x, e.y, -e.z);
	p[2] = new Vector3(e.x, -e.y, e.z);
	p[3] = new Vector3(e.x, -e.y, -e.z);
	p[4] = new Vector3(-e.x, e.y, e.z);
	p[5] = new Vector3(-e.x, e.y, -e.z);
	p[6] = new Vector3(-e.x, -e.y, e.z);
	p[7] = new Vector3(-e.x, -e.y, -e.z);
	for (var i : int = 0; i < 8; i++) {
		p[i] = p[i] + g.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds.center;
		p[i].x = p[i].x * g.transform.localScale.x;
		p[i].y = p[i].y * g.transform.localScale.y;
		p[i].z = p[i].z * g.transform.localScale.z;
		p[i] = g.transform.rotation * p[i];
		p[i] = p[i] + g.transform.position;
	}
	Debug.DrawLine(p[0], p[1], Color.red);
	Debug.DrawLine(p[0], p[2], Color.green);
	Debug.DrawLine(p[0], p[4], Color.blue);
}
