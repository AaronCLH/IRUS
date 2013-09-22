///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 														SETBACK LINES SCRIPT
//
// This script controls all things related to the instantiation and visualization of setback lines. It is attached to parcel GameObjects
// on runtime. It heavily depends on the edges array inside of the Parcel script to work.
//
// At the moment, instantiation of setback lines seems to be somewhat inefficient and it is only effective for parcel with four lotlines.
// In any other case, the setback lines that are created are not correct. The next step would be able to create setback lines for parcels
// which have more than 4 elements in the edges array.
//
// This script contains the LotLine class, and this class is essentially just an extension of the line class. It contains setback information,
// as well as having a reference to the actual line instance.
//
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#pragma strict

public enum LineType {Front, Rear, Side, Flankage} // Enumerations make the LineType very clear
static var NUM_LINE_TYPES : int = 4;			   // The number of LineTypes
static var LINE_TYPES : String[] = ["Front", "Rear", "Side", "Flankage"]; // The actual LineTypes as strings

private var lotLines : LotLine[];				   // Array of LotLine instances denoting the lotlines on the associated parcel

private var wallPrefab : GameObject;			   // Prefab object used to visualize the setback lines
private var setbackWalls : GameObject[];		   // Array of wallPrefab instances

public var numLabels : int = 0;					   // The number of labels assigned to the LotLines
public var numLines : int = 0;					   // The size of the lotLines array

private var sbsSet : boolean = false;			   // Are the setbacks initialized and ready to be shown?
										
private var EXTRA_ALLOWANCE : float = 5.0;		   // The extra allowance placed at the end of the setback line when placing the lines	   

private var uiAccessor : UIControl;				   // Q: What do you get when you cross an accountant with a airplane?
												   // A: A Boring 747
private var landuseUI : LandUseUI;				   // Reference to LandUseUI
private var parcel : Parcel;					   // Parcel script instance attached to the gameObject that this script is attached to
private var messageDisplayer : MessageDisplay;	   // Allows us to display messages to the user	

//										LotLine
// Variables:
// sbLine - a Line object that is the setback line associated with this lotLine
// setback - a float denoting the setback amount
// setbackInstance - a reference to this script
// type - the type of lotLine
// line - the line defining this lotLine
public class LotLine {
	public var sbLine : Line;
	public var setback : float;
	private var setbackInstance : SetbackLines;
	private var type : String;
	private var line : Line;
	function LotLine(ln : Line, sbInst : SetbackLines) { // Constructor function, requires a line and an instance of this script
		line = ln;
		setbackInstance = sbInst;
	}
	public function setType(str : String) { // Sets the type of this lotLine to str
		if (type == null || type == "") setbackInstance.numLabels++;
		type = str;
	}
	public function getLine() { // Gets the line defining the lotLine
		return line;
	}
	public function getType() { // Gets the type of this lotLine
		return type;
	}
	static function DirectionFromTo (l1 : Line, l2 : Line) { // This function finds and returns the direction with the smallest
															 // magnitude between two points out of the four in l1 and l2, with
															 // the condition that one point is from l1, and one is from l2
		var line1 : Vector3 = l2.getP1() - l1.getP1();
		var line2 : Vector3 = l2.getP2() - l1.getP1();
		var line3 : Vector3 = l2.getP1() - l1.getP2();
		var line4 : Vector3 = l2.getP2() - l1.getP2();
		var dirArray : Vector3[] = [line1, line2, line3, line4];
		var min : float = dirArray[0].magnitude;
		var minPos : int = 0;
		for (var i : int = 1; i < dirArray.length; i++) {
			var dist : float = dirArray[i].magnitude;
			if (dist < min) {
				min = dist;
				minPos = i;
			}
		}
		return dirArray[minPos];
	}
	static function PointOfIntersection (line1 : Line, line2 : Line) { // This function finds the point of intersection between line1 and line2
		var factor : float = (line1.getP1().x-line1.getP2().x)*(line2.getP1().z-line2.getP2().z) -
		(line1.getP1().z-line1.getP2().z)*(line2.getP1().x-line2.getP2().x);
		var xInt : float = ((line2.getP1().x-line2.getP2().x)*(line1.getP1().x*line1.getP2().z-line1.getP1().z*line1.getP2().x) -
		(line1.getP1().x-line1.getP2().x)*(line2.getP1().x*line2.getP2().z-line2.getP1().z*line2.getP2().x)) / factor;
		var zInt : float = ((line2.getP1().z-line2.getP2().z)*(line1.getP1().x*line1.getP2().z-line1.getP1().z*line1.getP2().x) -
		(line1.getP1().z-line1.getP2().z)*(line2.getP1().x*line2.getP2().z-line2.getP1().z*line2.getP2().x)) / factor;
		return Vector3(xInt, 0, zInt);
	}		
}

function Start() {
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);
	landuseUI = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(LandUseUI);
	parcel = gameObject.GetComponent(Parcel);
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
}

public function getLotLines() { // Gets the lotlines array
	return lotLines;
}

public function provideWallPrefab (go : GameObject) { // provides the wallPrefab GameObject
	wallPrefab = go;
}

// This function starts the labelling process and opens up the LineLabelling UI, if there are 4 lotlines. Otherwise, it sends
// the user back to the parcel editor. We need to indicate that the type of this function is void to avoid a cyclic reference.
public function startLabelling() : void {
	LineLabellingUI.CurrentSetbacks = this;
	LineLabellingUI.CurrentParcel = parcel;
	parcel.visualize(); // Shows the lotlines and ghost the building
	setLotLines();
	if (lotLines.length != 4) {
		messageDisplayer.addMessage("There are more than 4 lot lines." + "\n" +
									"The current functions related to setback lines are only designed to handle 4 lot lines.");
		parcel.hideLotlines();
		uiAccessor.openUI(UI.LandUse);
		landuseUI.newContext(parcel);
		landuseUI.pushLayerToTop(LandUseLayer.ParcelEditor);
		landuseUI.gameObject.GetComponent(LandUseUI_ParcelEditor).setTogglesFalse();
	} else {
		uiAccessor.openUI(UI.LineLabelling);
	}
}

// This function gets the lotline LineTypes as strings and returns them as an array of LineTypes as numbers corresponding to the
// string's position in the enumeration.
public function getEncodedRefs () {
	var numArray : int[] = new int[numLines];
	for (var i : int = 0; i < numLines; i++) {
		if (lotLines[i].getType() == LINE_TYPES[LineType.Front]) numArray[i] = LineType.Front;
		else if (lotLines[i].getType() == LINE_TYPES[LineType.Rear]) numArray[i] = LineType.Rear;
		else if (lotLines[i].getType() == LINE_TYPES[LineType.Side]) numArray[i] = LineType.Side;
		else numArray[i] = LineType.Flankage;
	}
	return numArray;
}

// This function takes in a reference array, refs, like the one produced in getEncodedRefs(), and a corrensponding array of
// setback amounts, sbAmounts, and uses refs and sbAmounts to correctly initialize the lotLines and setback lines.
public function useEncodedRefs (refs : int[], sbAmounts : float[]) {
	LineLabellingUI.CurrentSetbacks = this;
	setLotLines(); 
	sbsSet = true;
	for (var i : int = 0; i < numLines; i++) {
		lotLines[i].setType(LINE_TYPES[refs[i]]); // Set the lotline type and setback amount using refs and sbAmounts
		lotLines[i].setback = sbAmounts[i];
	}
	for (i = 0; i < numLines; i++) {
		placeTempSetback(lotLines[i].setback, i); // Call the placeTempSetback function afterwards for each lotLine, as you
												  // need all the types to be set before running this function
	}
	resizeSetbacks();	
	buildLowerWalls(); // Instantiates the setback wall GameObjects
}													

// This function initializes the lotLines array					
private function setLotLines () {
	if (parcel.edges.length == 0) parcel.calcLotLines();
	numLines = parcel.edges.length;
	lotLines = new LotLine[numLines];
	for (var i : int = 0; i < numLines; i++) {
		lotLines[i] = LotLine((parcel.edges[i] as Line), this);
	}
}

// This is a helper function for UseEncodedRefs(). It places a temporary setback line at a setback distance of sb on the
// lotLine corresponding to position pos in the lotLines array		
private function placeTempSetback(sb : float, pos : int) {
	var ll : LotLine = lotLines[pos];
	
	// If ll is a front lot line, look through the LotLines array for a line that is a rear lot line and call the setbackline
	// helper function
	if (ll.getType() == LINE_TYPES[LineType.Front]) {
		for (var newLL : LotLine in lotLines) {
			if (newLL.getType() == LINE_TYPES[LineType.Rear]) {
				ll.sbLine = setbackLine(ll.getLine(), newLL.getLine(), sb);
			}
		}
	} 
	// Otherwise, if ll is a rear lot line, look through the LotLines array for a line that is a front lot line and call the
	// setbackline helper function.
	else if (ll.getType() == LINE_TYPES[LineType.Rear]) {
		for (var newLL : LotLine in lotLines) {
			if (newLL.getType() == LINE_TYPES[LineType.Front]) {
				ll.sbLine = setbackLine(ll.getLine(), newLL.getLine(), sb);
			}
		}
	} 
	// Otherwise, if ll is a side lot line, look through the LotLines array for a line that is a side or flankage lot line
	// and call the setbackline helper function
	else if (ll.getType() == LINE_TYPES[LineType.Side]) {
		for (var newLL : LotLine in lotLines) {
			if ((newLL.getType() == LINE_TYPES[LineType.Side] || newLL.getType() == LINE_TYPES[LineType.Flankage]) 
				&& Line.LineEqual(ll.getLine(), newLL.getLine()) == false) {
				ll.sbLine = setbackLine(ll.getLine(), newLL.getLine(), sb);
			}
		}
	} 
	// Getting to the else means that ll is a flankage lot line. Look through the LotLines array for a line that is a side or
	// flankage lot line and call the setbackline helper function
	else {
		for (var newLL : LotLine in lotLines) {
			if ((newLL.getType() == LINE_TYPES[LineType.Side] || newLL.getType() == LINE_TYPES[LineType.Flankage]) 
				&& Line.LineEqual(ll.getLine(), newLL.getLine()) == false) {
				ll.sbLine = setbackLine(ll.getLine(), newLL.getLine(), sb);
			}
		}
	}
}

// Places a setback line at a certain distance (sb) away from the inputted line, inputLine, in the direction of the opposite line, 
// oppLine.
private function setbackLine (inputLine : Line, oppLine : Line, sb : float) {
	var dir1 : Vector3 = LotLine.DirectionFromTo(inputLine, oppLine);
	var lineDir : Vector3 = -inputLine.getDirection(); // Negate it because getDirection goes from point 2 to point 1, but 
													   // DirectionFromTo goes from point 1 to point 2.
	var normal : Vector3 = new Vector3(lineDir.z, 0, -lineDir.x); 
	if (Vector3.Dot(dir1, normal) < 0) { // If the normal makes greater than a 180 degree angle with dir1, then negate it.
		normal = -normal;
	}
	// We need the extra allowance to ensure that the setback lines still intersect on both sides even when pushed inwards.
	var point1 : Vector3 = inputLine.getP1() - lineDir/lineDir.magnitude*EXTRA_ALLOWANCE + normal/normal.magnitude*sb;
	var point2 : Vector3 = inputLine.getP2() + lineDir/lineDir.magnitude*EXTRA_ALLOWANCE + normal/normal.magnitude*sb;
	return new Line(point1, point2);
}


// Called when all lotlines are labelled. Resizes the generated setback lines so that they do not cross parcel boundaries	
private function resizeSetbacks () {
	var poi : Vector3;
	// For each lotLine in lotLines, loop through the lotLines array again.
	for (var ll1 : LotLine in lotLines) {
		for (var ll2 : LotLine in lotLines) {
			
			// If ll1's type is Front or Rear and ll2's type is side or flankage, find the point of intersection
			// between ll1's setback line and ll2's lot line, and update one ll1's setback line's endpoints.
			if ((ll1.getType() == LINE_TYPES[LineType.Front] || ll1.getType() == LINE_TYPES[LineType.Rear]) && 
			(ll2.getType() == LINE_TYPES[LineType.Side] || ll2.getType() == LINE_TYPES[LineType.Flankage])) {
				poi = LotLine.PointOfIntersection(ll1.sbLine, ll2.getLine());
				
				// Update the first endpoint if the point of intersection is closer to the first endpoint.
				// Otherwise, update the second endpoint.
				if (Vector3.Distance(poi, ll1.sbLine.getP1()) < Vector3.Distance(poi, ll1.sbLine.getP2())) {
					ll1.sbLine.changeEndpoint(poi, true);
				} else ll1.sbLine.changeEndpoint(poi, false);
			} 
			
			// Otherwise is ll1's type is Side or Flankage and ll2's type is Front or Rear, find the point of intersection
			// between ll1's setback line and ll2's lot line, and update one ll1's setback line's endpoints.
			else if ((ll1.getType() == LINE_TYPES[LineType.Side] || ll1.getType() == LINE_TYPES[LineType.Flankage]) &&
			(ll2.getType() == LINE_TYPES[LineType.Front] || ll2.getType() == LINE_TYPES[LineType.Rear])) {
				poi = LotLine.PointOfIntersection(ll1.sbLine, ll2.getLine());
				
				// Update the first endpoint if the point of intersection is closer to the first endpoint.
				// Otherwise, update the second endpoint.
				if (Vector3.Distance(poi, ll1.sbLine.getP1()) < Vector3.Distance(poi, ll1.sbLine.getP2())) {
					ll1.sbLine.changeEndpoint(poi, true);
				} else ll1.sbLine.changeEndpoint(poi, false);
			}
		}
	}
}

// This function instantiates the setback wall prefab GameObjects. 
private function buildLowerWalls() {
	if (setbackWalls != null) {
		for (var obj : GameObject in setbackWalls) {
			Destroy(obj);
		}
	}
	setbackWalls = new GameObject[lotLines.length];
	for (var i : int = 0; i < lotLines.length; i++) {
		setbackWalls[i] = Instantiate(wallPrefab, lotLines[i].sbLine.getCenter(), Quaternion.LookRotation(lotLines[i].sbLine.getDirection()));
		var WPH : WallPrefabHover = setbackWalls[i].GetComponent(WallPrefabHover); // Give WallPrefabHover some information
		WPH.provideScriptInstance(this);
		WPH.provideLineType(lotLines[i].getType());
		WPH.provideSetbackAmount(lotLines[i].setback);
		parcel.giveLineType(lotLines[i].getType(), i);
		setbackWalls[i].transform.localScale.z = lotLines[i].sbLine.getDirection().magnitude;
		setbackWalls[i].transform.localScale.y = 1;
		setbackWalls[i].transform.parent = ParcelBuildingManager.ParcelWallParent.transform;
		setbackWalls[i].active = false; // Inactive by default
	}
}

// This function adds the label str to the lotLine in position pos in the lotLines array	
public function addLabel(str : String, pos : int) {
	lotLines[pos].setType(str);
}

// This function gets the points of intersection between setback lines for the massing script.
public function getPOIs () {
	var POIs : Vector3[] = new Vector3[4];
	var count : int = 0;
	
	// For each lotLine ll1 in the lotLines array, if ll1's type is either Front or Rear, loop through the lotLines array
	// again.
	for (var ll1 : LotLine in lotLines) {
		if (ll1.getType() == LINE_TYPES[LineType.Front] || ll1.getType() == LINE_TYPES[LineType.Rear]) {
			for (var ll2 : LotLine in lotLines) {
				// If ll2's type is either Side or Flankage, find the point of intersection between ll1's setback line
				// and ll2's setback line, and add it to the points of intersection array.
				if (ll2.getType() == LINE_TYPES[LineType.Side] || ll2.getType() == LINE_TYPES[LineType.Flankage]) {
					POIs[count] = LotLine.PointOfIntersection(ll1.sbLine, ll2.sbLine);
					count++;
				}
			}
		}
	}
	return POIs;
}

// This function deactivates all active setback walls.
public function hideSetbacks () {
	if (setbackWalls == null) return;
	for (var i : int = 0; i < lotLines.length; i++) {
		setbackWalls[i].active = false;
	}
}

//////////////// These four functions are only called when the lines have already been labelled, with setback amounts. ////////////////

// This function shows the lotLine of type num.
public function showLLofType (num : LineType, refs : int[], dists : float[]) {
	if (!sbsSet) useEncodedRefs(refs, dists);
	for (var i : int = 0; i < lotLines.length; i++) {
		if (LINE_TYPES[num] == lotLines[i].getType()) {
			parcel.showOneLine(i);
		}
	}
}

// Hides the lotLine of type num.
public function hideLLofType(num : LineType) {
	for (var i : int = 0; i < lotLines.length; i++) {
		if (LINE_TYPES[num] == lotLines[i].getType()) {
			parcel.hideOneLine(i);
		}
	}
}

// Shows the setback line of type num.
public function showSetbackOfType(num : LineType, refs : int[], dists : float[]) {
	if (!sbsSet) useEncodedRefs(refs, dists);
	for (var i : int = 0; i < lotLines.length; i++) {
		if (LINE_TYPES[num] == lotLines[i].getType()) {
			setbackWalls[i].active = true;
		}
	}
}

// Hides the setback line of type num.
public function hideSetbackOfType(num : LineType) {
	for (var i : int = 0; i < lotLines.length; i++) {
		if (LINE_TYPES[num] == lotLines[i].getType()) {
			setbackWalls[i].active = false;
		}
	}
}
