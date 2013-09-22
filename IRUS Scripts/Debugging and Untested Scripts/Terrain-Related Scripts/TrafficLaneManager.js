#pragma strict

//====================================================================================================
// CONSTANTS
//====================================================================================================
static var LANE_MIN_WIDTH : float = 3.0;
static var WHITE_STRIP_SPACE : float = 1.6;
static var WHITE_STRIP_LENGTH : float = 2.0;
static var MAX_NUM_OF_LANE : int = 20;
static var MIDDLELINE_END_SPACE : float = 0.2;
static var MAINROAD_WIDTH_THRESHOLD : float = 15.0;
private var PARENT_NAME : String = "Traffic Lanes";

//====================================================================================================
// VARIABLES
//====================================================================================================
static var yellowStrip : GameObject;
var yStrip : GameObject;
static var whiteStrip : GameObject;
var wStrip : GameObject;
static var crosswalkLine : GameObject;
var cWalkLine : GameObject;
private var roadSegments : RoadSegment[];

static var TrafficLanesParent : GameObject;

/*	this is a class for white dased lines
	unlike the solid lines, we cannot just stretch the GameObject to make a longer line
	here in this class we do the calculations with the given constants (WHITE_STRIP_SPACE, WHITE_STRIP_LENGTH)
	to create white dashed lines	*/
class WhiteDashedLine {
	private var whiteStrips : GameObject[];
	private var numWhiteStrip : int;
	private var start : Vector3;
	private var end : Vector3;
	function reset (p1 : Vector3, p2 : Vector3) {
		var increment : float = TrafficLaneManager.WHITE_STRIP_SPACE + TrafficLaneManager.WHITE_STRIP_LENGTH;
		var incrementV : Vector3 = increment * Vector3.Normalize(p2-p1);
		var numWhiteStrip = Mathf.Floor((Vector3.Distance(p1, p2)+TrafficLaneManager.WHITE_STRIP_SPACE) / increment);
		var length : float = Vector3.Distance(p1, p2);
		var rotation : Quaternion = Quaternion.LookRotation(p2 - p1);
		var endSpace : float = (length + TrafficLaneManager.WHITE_STRIP_SPACE - numWhiteStrip*increment) * 0.5;
		var pos : Vector3 = p1 + (endSpace + TrafficLaneManager.WHITE_STRIP_LENGTH*0.5) * Vector3.Normalize(p2-p1);
		var scale : float;
		if (whiteStrips == null) {
			whiteStrips = new GameObject[numWhiteStrip];
		} else if (numWhiteStrip > whiteStrips.length) {	// resize
			var tempArray : GameObject[];
			var tempSize : int = whiteStrips.length;
			tempArray = new GameObject[numWhiteStrip];
			System.Array.Copy(whiteStrips, tempArray, tempSize);
			whiteStrips = new GameObject[numWhiteStrip];
			tempSize = numWhiteStrip;
			System.Array.Copy(tempArray, whiteStrips, tempSize);
		}
		if (whiteStrips[0] == null) {
			whiteStrips[0] = GameObject.Instantiate(TrafficLaneManager.whiteStrip);
			whiteStrips[0].transform.parent = TrafficLaneManager.TrafficLanesParent.transform;
		}
		scale = TrafficLaneManager.WHITE_STRIP_LENGTH / whiteStrips[0].GetComponent(MeshFilter).mesh.bounds.size.z;
		for (var i : int = 0; i < numWhiteStrip; i++) {
			if (whiteStrips[i] == null) {
				whiteStrips[i] = GameObject.Instantiate(TrafficLaneManager.whiteStrip);
				whiteStrips[i].transform.parent = TrafficLaneManager.TrafficLanesParent.transform;
			}
			whiteStrips[i].renderer.enabled = true;
			whiteStrips[i].transform.rotation = rotation;
			whiteStrips[i].transform.position = pos;
			whiteStrips[i].transform.localScale.z = scale;
			whiteStrips[i].transform.localScale.y = 0.017;
			pos += incrementV;
		}
		for (i = numWhiteStrip; i < whiteStrips.length; i++) {
			whiteStrips[i].renderer.enabled = false;
		}
	}
	function hide () {
		if (whiteStrips != null) {
			for (var w : GameObject in whiteStrips){
				w.renderer.enabled = false;
			}
		}
	}
}

class RoadSegment {
	var sideOne : Side;
	var sideTwo : Side;
	var bothWay : boolean;
	private var length : float;
	private var middleLine : GameObject;
	private var whiteLines : WhiteDashedLine[];
	private var numLanePerSide : int;
	/* this constructor makes traffic lanes between two sidewalks */
	function RoadSegment (s1 : Side, s2 : Side, bWay : boolean) {
		var tempCW : Crosswalk;
		sideOne = s1;
		sideTwo = s2;
		if (getWidth() >= TrafficLaneManager.MAINROAD_WIDTH_THRESHOLD) {
			sideOne.setToBeByMainRoad();	// the sidewalks need to know if they are by a main road
			sideTwo.setToBeByMainRoad();	// because that affects the upper limit of their widths
		} else {
			sideOne.setToBeBySideRoad();
			sideTwo.setToBeBySideRoad();
		}
		bothWay = bWay;
		length = Vector3.Distance(s1.pivotPosition, s1.clockwiseNext.pivotPosition);
		middleLine = GameObject.Instantiate(TrafficLaneManager.yellowStrip);
		middleLine.transform.parent = TrafficLaneManager.TrafficLanesParent.transform;
		s1.setRoadSegment(this);
		s2.setRoadSegment(this);
		tempCW = s1.corner.AddComponent(Crosswalk);
		tempCW.setOtherSide(s2);
		tempCW.setMySide(s1);
		tempCW = s2.corner.AddComponent(Crosswalk);
		tempCW.setOtherSide(s1);
		tempCW.setMySide(s2);
		whiteLines = new WhiteDashedLine[TrafficLaneManager.MAX_NUM_OF_LANE];
		for (var w : WhiteDashedLine in whiteLines) {
				w = new WhiteDashedLine();
		}
		resetLanes();
	}
	public function getWidth () {
		return Vector3.Distance(sideOne.pivotPosition, sideTwo.clockwiseNext.pivotPosition) - (sideOne.getSidewalkWidth() + sideTwo.getSidewalkWidth());
	}
	public function getLength () {
		return length;
	}
	public function isBothWay () {
		return bothWay;
	}
	public function setBothWay (b : boolean) {
		bothWay = b;
		resetLanes();
	}
	public function resetLanes () {
		var partWidth : float = getWidth()*0.5;
		if (bothWay) {
			/// white (dashed lines)
			var whiteStartV : Vector3 = Vector3.Normalize(sideTwo.clockwiseNext.pivotPosition - sideOne.pivotPosition);
			var whiteEndV : Vector3 = Vector3.Normalize(sideTwo.pivotPosition - sideOne.clockwiseNext.pivotPosition);
			numLanePerSide = Mathf.Floor(partWidth/TrafficLaneManager.LANE_MIN_WIDTH);
			var startLaneWidth : float = partWidth/numLanePerSide;
			var endLaneWidth : float = partWidth/numLanePerSide;
			for (var w : WhiteDashedLine in whiteLines) {
					w.hide();
			}
			for (var i : int = 0; i < numLanePerSide - 1; i++) {
				whiteLines[i].reset(
					sideOne.pivotPosition + sideOne.getSidewalkWidth()*whiteStartV + (i+1)*startLaneWidth*whiteStartV,
					sideOne.clockwiseNext.pivotPosition + sideOne.getSidewalkWidth()*whiteEndV + (i+1)*endLaneWidth*whiteEndV);
			}
			for (i = 0; i < numLanePerSide - 1; i++) {
				whiteLines[i+numLanePerSide].reset(
					sideTwo.clockwiseNext.pivotPosition - sideTwo.getSidewalkWidth()*whiteStartV - (i+1)*startLaneWidth*whiteStartV,
					sideTwo.pivotPosition - sideTwo.getSidewalkWidth()*whiteEndV - (i+1)*endLaneWidth*whiteEndV);
			}
			/// yellow (middle)
			middleLine.transform.position = sideOne.pivotPosition + (sideOne.clockwiseNext.pivotPosition - sideOne.pivotPosition)*0.5 +
				(Vector3.Normalize(sideTwo.clockwiseNext.pivotPosition - sideOne.pivotPosition) * (sideOne.getSidewalkWidth() + partWidth));
			middleLine.transform.rotation = Quaternion.LookRotation(
				(sideOne.sidewalk.transform.position + (sideTwo.clockwiseNext.sidewalk.transform.position - sideOne.sidewalk.transform.position)*0.5) - 
				(sideOne.clockwiseNext.sidewalk.transform.position + (sideTwo.sidewalk.transform.position - sideOne.clockwiseNext.sidewalk.transform.position)*0.5));
			middleLine.transform.localScale.z = (length-2*TrafficLaneManager.MIDDLELINE_END_SPACE) / middleLine.GetComponent(MeshFilter).mesh.bounds.size.z;
			middleLine.transform.localScale.y = 0.017;
		} else {	/* one-way road */
			// to be implemented
		}
	}
}


//====================================================================================================
// START FUNCTION
//====================================================================================================
function Start() {
	TrafficLanesParent = GameObject.Find(PARENT_NAME);
	yellowStrip = yStrip;
	whiteStrip = wStrip;
	crosswalkLine = cWalkLine;
	
	/* hard-code the road segments here */
	roadSegments = new RoadSegment[7];
	roadSegments[0] = new RoadSegment (SidewalkManager.areas[0].sides[1], SidewalkManager.areas[5].sides[3], true);
	roadSegments[1] = new RoadSegment (SidewalkManager.areas[0].sides[0], SidewalkManager.areas[1].sides[2], true);
	roadSegments[2] = new RoadSegment (SidewalkManager.areas[1].sides[1], SidewalkManager.areas[4].sides[3], true);
	roadSegments[3] = new RoadSegment (SidewalkManager.areas[1].sides[0], SidewalkManager.areas[2].sides[2], true);
	roadSegments[4] = new RoadSegment (SidewalkManager.areas[2].sides[1], SidewalkManager.areas[3].sides[3], true);
	roadSegments[5] = new RoadSegment (SidewalkManager.areas[3].sides[2], SidewalkManager.areas[4].sides[0], true);
	roadSegments[6] = new RoadSegment (SidewalkManager.areas[4].sides[2], SidewalkManager.areas[5].sides[0], true);
}


// for debug use
function drawBounds (g : GameObject) {
	var p : Vector3[] = new Vector3[8];
	var e : Vector3 = g.transform.GetComponent(MeshFilter).mesh.bounds.extents;
	p[0] = new Vector3(e.x, e.y, e.z);
	p[1] = new Vector3(e.x, e.y, -e.z);
	p[2] = new Vector3(e.x, -e.y, e.z);
	p[3] = new Vector3(e.x, -e.y, -e.z);
	p[4] = new Vector3(-e.x, e.y, e.z);
	p[5] = new Vector3(-e.x, e.y, -e.z);
	p[6] = new Vector3(-e.x, -e.y, e.z);
	p[7] = new Vector3(-e.x, -e.y, -e.z);
	for (var i : int = 0; i < 8; i++) {
		p[i] = p[i] + g.transform.GetComponent(MeshFilter).mesh.bounds.center;
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
