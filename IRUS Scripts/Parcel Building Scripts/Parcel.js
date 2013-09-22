///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//															PARCEL SCRIPT
//
// This script is used as the main host of all functionality related to a parcel, except for the calculation of setback lines.
//
// The line class is created here, and it is used to store the endpoints of a line, along with basic functions related to one line
// or two.
//
// One of the most important features of this script is its ability to calculate lot lines, and it stores these inside of the edges 
// array after calcLotLines() is called.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma strict

static var RAYCAST_MASK_LAYER : int = 29;		// Rays sent on this layer will only collide with parcels and buildings. See 
												// ParcelBuildingManager
private var WALL_HEIGHT : float = 0.5;			// The height of the lotline visualizations

private var freeWallPrefab : GameObject;		// The green lotline prefab object that gets shown for empty parcels
private var occupiedWallPrefab : GameObject;	// The red lotline prefab object that gets shown for occupied parcels

public var freeWalls : GameObject[];			// An array of freeWallPrefab instances
private var occupiedWalls : GameObject[];		// An array of occupiedWallPrefab instances
			
private var building : Building;				// The building on this parcel
private var vertices : Vector3[];				// The vertices of this parcel's mesh
private var triangles : int[];					// The triangles on this parcel's mesh

private var trisLines : Array;					// All of the lines created by the references inside triangles
public var edges : Array;						// The edges/lotlines of the parcel

private var sbAccessor : SetbackLines;			// Access to the SetbackLines script attached to this parcel
private var uiAccessor : UIControl;				// You know what it is

// 											Line Class
// Variables: 
// p1 - The first endpoint of the line
// p2 - The second endpoint of the line (it doesn't matter which point is p1 and which point is p2)
public class Line {
	static var TOL : float = 0.07; // The tolerance on whether or not lines are parallel. Determined experimentally.
	protected var p1 : Vector3;
	protected var p2 : Vector3;
	function Line (p1 : Vector3, p2 : Vector3) { // Simple constructor function, takes in two endpoints and makes a line
		this.p1 = p1;
		this.p2 = p2;
	}
	public function length() { // Gets the length of the line
		return (p1 - p2).magnitude;
	}
	public function getP1 () { // Gets point 1
		return p1;
	}
	public function getP2 () { // Gets point 2
		return p2;
	}
	public function getCenter () { // Gets the midpoint of the line
		return (p1+p2)*0.5;
	}
	public function getDirection () { // Gets the direction that the line is going
		return p1-p2;
	}
	public function changeEndpoint (newPoint : Vector3, firstPoint : boolean) { // Mutates one of the endpoints of the line to newPoint
		if (firstPoint) this.p1 = newPoint;
		else this.p2 = newPoint;
	}
	public function sameLine(l1 : Line, l2 : Line) { // Checks if the lines are the same line
		return (pointsApproximately(l1.p1, l2.p1) && pointsApproximately(l1.p2, l2.p2)) || 
		(pointsApproximately(l1.p1, l2.p2) && pointsApproximately(l1.p2, l2.p1));
	}
	static function LineEqual (l1 : Line, l2 : Line) { // More strongly checks if the lines are the same line. I don't remember why I would
													   // have used LineEqual over sameLine, but it works and I don't want to experiment
													   // again.
		return (l1.getP1()==l2.getP1()&&l1.getP2()==l2.getP2())||(l1.getP1()==l2.getP2()&&l1.getP2()==l2.getP1());
	}
	static function IsParallel (line1: Line, line2: Line) { // Checks if two lines are parallel enough (to a certain tolerance TOL)
		return Vector3.Cross(line1.getDirection(), line2.getDirection()).magnitude/(line1.length()*line2.length()) < TOL;
	}
	static function IsOverlap (line1: Line, line2: Line) { // Checks if either line overlaps the other
		return Mathf.Approximately(PointLineDist(line2.getP1(),line1),0.0) ||
		 Mathf.Approximately(PointLineDist(line2.getP2(), line1), 0.0);
	}
	static function PointLineDist (v: Vector3, l: Line) : float { // Finds the distance from a point v, to the closest point on a line l
		var magSquare : float = Mathf.Pow((l.p1 - l.p2).magnitude, 2);
		var t : float = Vector3.Dot(v - l.p1, l.p2 - l.p1) / magSquare;
		if ( t < 0.0 ) return (v - l.p1).magnitude;
		if ( t > 1.0 ) return (v - l.p2).magnitude;
		return (v - (l.p1 + (t*(l.p2 - l.p1)))).magnitude;
	}
	static function IsOneLine (line1: Line, line2: Line) { // Determines if two lines are the same line
		return IsParallel(line1, line2) && IsOverlap(line1, line2);
	}
	private function pointsApproximately (p1 : Vector3, p2 : Vector3) { // Checks if points are approximately the same. Needed for floats
		return Mathf.Approximately(p1.x, p2.x) && Mathf.Approximately(p1.y, p2.y) && Mathf.Approximately(p1.z, p2.z);
	}
	static function isPointsApproximately (p1 : Vector3, p2 : Vector3) { // as static function to make life easier..
		return (Mathf.Approximately(p1.x, p2.x) && Mathf.Approximately(p1.y, p2.y) && Mathf.Approximately(p1.z, p2.z));
	}
	static function LineIntersectionPoint(line1 : Line, line2 : Line) : Vector3 {
		// Get A,B,C of first line - points
		var A1 : float = line1.p2.z-line1.p1.z;
		var B1 : float = line1.p1.x-line1.p2.x;
		var C1 : float = A1*line1.p1.x+B1*line1.p1.z;

		// Get A,B,C of second line - points
		var A2 : float = line2.p2.z-line2.p1.z;
		var B2 : float = line2.p1.x-line2.p2.x;
		var C2 : float = A2*line2.p1.x+B2*line2.p1.z;

		// Get delta and check if the lines are parallel
		var delta : float = A1*B2 - A2*B1;
		if(delta == 0) {
			Debug.Log("Lines are parallel");
			return;
		}

		// now return the Vector2 intersection point
		return new Vector3((B2*C1 - B1*C2)/delta,0,(A1*C2 - A2*C1)/delta);
	}
	static function FindIntersectionPointOfProjection(line1 : Line, line2 : Line) {
		//First Check if the line is parallel
		if(IsParallel(line1,line2)) {
			return null;
		}
		/*//If not parallel, check to see if they are on the same plane
		var normal : Vector3 = Vector3.Cross(line1.getDirection(),line2.getDirection()).Normalize();
		if(!(Vector3.Dot(line1.getDirection(),normal) == 0 && Vector3.Dot(line2.getDirection(),normal) == 0)) {
			return null;
		}*/
		line1.p1.y = 0;
		line1.p2.y = 0;
		line2.p1.y = 0;
		line2.p2.y = 0;
		/*
		if(!Mathf.Approximately((line1 as Line).getP1().y,0.0) || !Mathf.Approximately((line1 as Line).getP2().y,0.0) || !Mathf.Approximately((line2 as Line).getP1().y,0.0) || !Mathf.Approximately((line2 as Line).getP2().y,0.0)) {
			// skew line
			return null;
		}
		var joinLine : Line = Line(p1,p2);
		return (joinLine as Line).getCenter();*/
	}
	static function WhichPointsCloser (refPt : Vector3, p1 : Vector3, p2 : Vector3) { // Compares which point is closer to the reference point refPt, if the same, returns p1
		var line1 : float = (refPt - p1).magnitude;
		var line2 : float = (refPt - p2).magnitude;
		if(line1 <= line2) {
			return p1;
		} else {
			return p2;
		}
	}
	static function WhichPointsFurther (refPt : Vector3, p1 : Vector3, p2 : Vector3) { // Compares which point is closer to the reference point refPt, if the same, returns p1
		var line1 : float = (refPt - p1).magnitude;
		var line2 : float = (refPt - p2).magnitude;
		if(line1 >= line2) {
			return p1;
		} else {
			return p2;
		}
	}
	static function WhichPointsClosest (refPt : Vector3, number : int, points : Vector3[]) { // Return (number) points that are the closest to the reference point refPt
		if(points.length < number) {
			//Debug.Log("WhichTwoPointsClosest: Need more points to compare");
			return null;
		} else if(points.length == number) {
			//Debug.Log("WhichTwoPointsClosest: Only two points are given");
			return points;
		}
		var lines : Array = new Array();
		var returnPoints : Vector3[] = new Vector3[number];
		for(var i = 0; i < points.length; i++) {
			lines.Push((refPt - points[i]).magnitude);
		}
		lines.Sort();
		var index : int = 0;
		for(i = 0; i < points.length; i++) {
			//if((refPt - points[i]).magnitude == lines[0] || (refPt - points[i]).magnitude == lines[1]) {
			if((refPt - points[i]).magnitude < parseFloat(lines[number-1].ToString()) || Mathf.Approximately((refPt - points[i]).magnitude,parseFloat(lines[number-1].ToString()))) {
				if(index >= number) {
					break;
				}
				returnPoints[index] = points[i];
				index++;
			}
		}
		/*for(var point in returnPoints) {
			Debug.Log("WhichPointsClosest: " + point.ToString());
		}*/
		/*for(i = 0; i < returnPoints.length; i++) {
			Debug.Log("WhichPointsClosest["+i+"] : " + returnPoints[i].ToString());
		}*/
		if(number == 1) {
			return returnPoints[0];
		}
		return returnPoints;
	}
}		

function Start () {
	var m : Mesh = gameObject.GetComponent(MeshFilter).mesh;
	gameObject.layer = RAYCAST_MASK_LAYER; // Put the parcel inside the correct layer
	vertices = m.vertices;
	triangles = m.triangles;
	edges = new Array();
	trisLines = new Array();
	sbAccessor = gameObject.GetComponent(SetbackLines);
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl); // In the jungle, the mighty jungle, the lion sleeps tonight
}

public function occupiedByBuilding (b : Building) {
	building = b;
}

public function freeParcel () {
	building = null;
}

public function visualize () { // Shows the lot lines and ghosts the building
	showLotlines();
	if (building != null) building.ghost();
}

public function stopVisual () { // Hides the lot lines, setback lines, and the massing
	hideLotlines();
	gameObject.GetComponent(SetbackLines).hideSetbacks();
	gameObject.GetComponent(Massing).hideMassing();
	if (building != null) building.showFull();
}

public function hideLotlines () { // Hides the lot lines
	if (freeWalls == null) return;
	for (var i : int; i < freeWalls.length; i++) {
		freeWalls[i].active = false;
		occupiedWalls[i].active = false;
	}
}

public function showLotlines () { // Shows the lot lines. Determines whether to show freeWalls or occupiedWalls.
	if (freeWalls == null) {
		buildWalls();
	}
	if (building == null) {
		for (var w : GameObject in freeWalls) {
			w.active = true;
		}
	} else {
		for (w in occupiedWalls) {
			w.active = true;
		}
	}
}

// This function calculates the lotines and sizes the freeWallPrefabs and occupiedWallPrefabs to fit on the lotlines.
public function buildWalls () {
	calcLotLines();
	freeWalls = new GameObject[edges.length];
	occupiedWalls = new GameObject[edges.length];
	for (var i : int = 0; i < edges.length; i++) { // Iterate once for each lotline.
	
		// This makes the GameObject face the proper direction
		freeWalls[i] = Instantiate(freeWallPrefab, (edges[i] as Line).getCenter(), Quaternion.LookRotation((edges[i] as Line).getDirection()));
		
		freeWalls[i].GetComponent(WallPrefabHover).provideScriptInstance(this); // Give a parcel instance to WallPrefabHover
		freeWalls[i].transform.localScale.z = (edges[i] as Line).getDirection().magnitude;
		freeWalls[i].transform.localScale.y = WALL_HEIGHT*2;
		freeWalls[i].transform.parent = ParcelBuildingManager.ParcelWallParent.transform;
		freeWalls[i].active = false; // Inactive by default
		
		occupiedWalls[i] = Instantiate(occupiedWallPrefab, (edges[i] as Line).getCenter(), 
		Quaternion.LookRotation((edges[i] as Line).getDirection()));
		
		occupiedWalls[i].GetComponent(WallPrefabHover).provideScriptInstance(this); // Give a parcel instance to WallPrefabHover
		occupiedWalls[i].transform.localScale.z = (edges[i] as Line).getDirection().magnitude;
		occupiedWalls[i].transform.localScale.y = WALL_HEIGHT*2;
		occupiedWalls[i].transform.parent = ParcelBuildingManager.ParcelWallParent.transform;
		occupiedWalls[i].active = false; // Inactive by default
	}
}

// These two functions, called in ParcelBuildingInitialize, provide the wall prefab GameObjects for this script.
public function provideFreeWallPrefab (fwp : GameObject) {
	freeWallPrefab = fwp;
}
public function provideOccupiedWallPrefab (owp : GameObject) {
	occupiedWallPrefab = owp;
}

public function getBuilding () {
	return building;
}

// Adds a line, l, to the edges array. 
// How it works is that it initially checks if there is only one line equal to l inside of the trisLines. If there is,
// then it proceeds to loop through all of the lines in the edges array, and checks if there is a line inside of the
// edges array that lies along the same line as l. If so, the longest line that can be formed between this line and l
// is assigned to l, and the line that was the same as l is removed from the edges array. The loop is reset at this point.
// After this loop is completed, add l to the edges array.
private function addLineToEdges (l: Line) {
	var tempCounter: int = 0;
	var longestL: Line;
	if (isExtLine(l)) {
		for(var i : int = 0; i < edges.length; i++) {
			if(Line.IsOneLine(l,edges[i] as Line)) {
				l = longestLine(l, edges[i] as Line);
				edges.RemoveAt(i);
				i = -1;
			}
		}
		edges.push(l);
	}
}

// This function calculates the lot lines and stores them in the edges array.
// Initially, it builds the trisLines array as an array of lines that are formed by the triangle references.
// Then, it again creates lines from triangle references, but this time it uses the function addLineToEdges to 
// build the edges array.
public function calcLotLines () {
	var l: Line;
	var p1: Vector3;
	var p2: Vector3;
	var p3: Vector3;
	for (var i:int =  0; i < triangles.length; i+=3) {
		// Transforms position of vertices from local space to world space
		p1 = gameObject.transform.TransformPoint(vertices[triangles[i]]);
		p2 = gameObject.transform.TransformPoint(vertices[triangles[i+1]]);
		p3 = gameObject.transform.TransformPoint(vertices[triangles[i+2]]);
		l = new Line(p1, p2);
		trisLines.push(l);
		l = new Line(p2, p3);
		trisLines.push(l);
		l = new Line(p3, p1);
		trisLines.push(l);
	}
	for (i =  0; i < triangles.length; i+=3) {
		p1 = gameObject.transform.TransformPoint(vertices[triangles[i]]);
		p2 = gameObject.transform.TransformPoint(vertices[triangles[i+1]]);
		p3 = gameObject.transform.TransformPoint(vertices[triangles[i+2]]);
		l = new Line(p1, p2);
		addLineToEdges(l);
		l = new Line(p2, p3);
		addLineToEdges(l);
		l = new Line(p3, p1);
		addLineToEdges(l);
	}
	return edges;
}

// This function returns true iff there is one line equal to l inside of trisLines
private function isExtLine (l: Line) {
	var foundOne : boolean = false;
	for (var tL : Object in trisLines) {
		if (Line.LineEqual(l as Line, tL as Line)) {
			if (!foundOne) foundOne = true;
			else return false;
		}
	}
	return true;
}

// This function returns the longest line that can be formed by 4 points making up line1 and line2
private function longestLine (line1: Line, line2: Line) {
	var max: float = 0;
	var longestL: Line = new Line(line1.getP1(), line1.getP2());
	var dist: float = Vector3.Distance(line1.getP1(), line2.getP1());
	if (dist > max) {
		longestL.changeEndpoint(line1.getP1(),true);
		longestL.changeEndpoint(line2.getP1(),false);
		max = dist;
	}
	dist = Vector3.Distance(line1.getP1(), line2.getP2());
	if (dist > max) {
		longestL.changeEndpoint(line1.getP1(),true);
		longestL.changeEndpoint(line2.getP2(),false);
		max = dist;
	}
	dist = Vector3.Distance(line1.getP2(), line2.getP1());
	if (dist > max) {
		longestL.changeEndpoint(line1.getP2(),true);
		longestL.changeEndpoint(line2.getP1(),false);
		max = dist;
	}
	dist = Vector3.Distance(line1.getP2(), line2.getP2());
	if (dist > max) {
		longestL.changeEndpoint(line1.getP2(),true);
		longestL.changeEndpoint(line2.getP2(),false);
		max = dist;
	}
	return longestL;
}	

// This function places a building gameobject, g, in the approximate center of the parcel, and scales it accordingly
public function placeBuilding (g : GameObject) {
	var tempG : GameObject;
	var tempB : Building;
	var tempV : Vector3;
	
	tempG = Instantiate(g); 
	
	// this block adds a collider to each mesh in the children of the building object, if it doesn't already have one
	var Ms : Component[] = tempG.GetComponentsInChildren(MeshFilter);
	for (var i : int = 0; i < Ms.Length; i++) {
		if (Ms[i].gameObject.GetComponent(Collider) == null) Ms[i].gameObject.AddComponent(MeshCollider);
	}
	
	var Rs : Component[] = tempG.GetComponentsInChildren(MeshRenderer);
	var B : Bounds = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	
	for (i = 1; i < Rs.Length; i++) {
		B.Encapsulate((Rs[i] as MeshRenderer).bounds); // B is constantly mutated to include more bounds
	}
	
	var parcelBounds : Bounds = gameObject.GetComponent(MeshRenderer).bounds;
	var parcelMinDimension : float = Mathf.Min(parcelBounds.size.x, parcelBounds.size.z);
	var buildingMaxDimension : float = Mathf.Max(B.size.x, B.size.z);
	
	Debug.Log(parcelMinDimension);
	Debug.Log(buildingMaxDimension);
	
	tempG.transform.localScale *= parcelMinDimension/buildingMaxDimension; // This factor ensures that the building does not go past the
																		   // parcel boundaries
	
	Rs = tempG.GetComponentsInChildren(MeshRenderer);
	B = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	
	for (i = 1; i < Rs.Length; i++) {
		B.Encapsulate((Rs[i] as MeshRenderer).bounds); // Need to adjust again after scaling
	}
	
	tempV = parcelBounds.center;	// place it at the "center" of the parcel
	tempV += tempG.transform.position - B.center; // Improve the position of the center of the parcel
	tempV.y += B.extents.y;
	tempG.transform.position = tempV;
	
	yield;
	tempB = tempG.AddComponent(Building);
	tempB.occupyParcel(this);
	if (getBuilding() !== null) getBuilding().destroyBuilding(); // If there's a building on this parcel, destroy it
	occupiedByBuilding(tempB);
}

// These functions show or hide one lot line, based on a reference position inside of the edges array
public function showOneLine (i : int) {
	if (building == null) {
		freeWalls[i].active = true;
	} else {
		occupiedWalls[i].active = true;
	}
}
public function hideOneLine (i : int) {
	if (building == null) {
		freeWalls[i].active = false;
	} else {
		occupiedWalls[i].active = false;
	}
}

public function getSetbackInstance() {
	return sbAccessor;
}

// This function provides the type of this line to WallPrefabHover
public function giveLineType(str : String, i : int) {
	if (freeWalls == null) buildWalls();
	freeWalls[i].GetComponent(WallPrefabHover).provideLineType(str);
	occupiedWalls[i].GetComponent(WallPrefabHover).provideLineType(str);
}	