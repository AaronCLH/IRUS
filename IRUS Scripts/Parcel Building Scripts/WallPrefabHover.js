//
// Wall Prefab Hover - This script is attached to those wall prefabs references inside of the setback lines and parcel scripts.
//					   The idea is that, upon hovering over one of those prefabs, you get information about what the prefab represents.
//
// Notes:
//
//  *	This script is flawed in two major ways. One, the information shown is not always correct, especially when lines are
// 		labelled in the database but were not labelled on this inception of runtime. Database access is probably in this script's 
//		future. Secondly, the tooltip that appears upon hovering is not textured with anything other than the default Unity skin.
//		The textures required for this script are inside Assets/Textures/Tooltip Window
//

#pragma strict

private var parcelScript : Parcel;			// The parcel instance that this GameObject is contained within
private var setbackScript : SetbackLines;	// The setbacklines instances that this GameObject is contained within
private var lineType : String; 				// The type of the line that this GameObject represents
private var sbAmount : float;				// The setback amount of this GameObject

private var WAIT_TIME : float = 0.4;		// The time, in seconds, that it takes for the tooltip to appear upon hovering
private var curTime : float;				// The current time to wait before showing the tooltip
private var show : boolean;					// Can the tooltip be shown?
private var setback : boolean;				// Is this prefab inside a setback script?
private var linesLabelled : boolean;		// Are the associated lotlines labelled?

private var tooltipLocation : Vector2;		// Location for the top left corner of the tooltip
private var LOC_OFFSET : int = 20;			// The x AND y offset of tooltipLocation from Input.mousePosition
private var BOX_HEIGHT : int = 20;			// The height of a one-line tooltip
private var BOX_WIDTH : int = 130;			// The width of the tooltip

private var uiAccessor : UIControl;			// NANANANANANANANANANANANANANANANA BATMAN	
private var parcelEditor : LandUseUI_ParcelEditor;	// Reference to the parcel editor

function Start () {
	curTime = WAIT_TIME; // Initialize the current wait time to be the default wait time
	show = false;	
	if (gameObject.name.Contains("setbackWallPrefab")) setback = true;
	else setback = false;
	linesLabelled = false;
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);
	parcelEditor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(LandUseUI_ParcelEditor);
}

function Update () {
	linesLabelled = parcelEditor.checkLabelling();
}

function OnMouseOver() { // As the mouse is hovering, if the object is active, reduce curTime. If curTime == 0, set show to true
	if (gameObject.active) {
		if (curTime == 0) {
			show = true;
		} else {
			curTime -= Time.deltaTime;
			if (curTime < 0) curTime = 0;
		}
	} else curTime = WAIT_TIME;
}
 
function OnMouseExit() { // when the mouse stops hovering, reset curTime and show to their defaults
	curTime = WAIT_TIME;
	show = false;
}

function OnGUI() {
	if (show == true && uiAccessor.checkUIState(UI.LineLabelling)) { // If tooltip should be shown and we are not in the labelling phase
		tooltipLocation = new Vector2(Input.mousePosition.x + LOC_OFFSET, Screen.height - Input.mousePosition.y + LOC_OFFSET);
		if (!linesLabelled) { // If the lines are unlabelled => line is a LotLine. Setback lines are made through labels
			if (Screen.height - tooltipLocation.y < BOX_HEIGHT) tooltipLocation.y = Screen.height - BOX_HEIGHT;
			if (Screen.width - tooltipLocation.x < BOX_WIDTH) tooltipLocation.x = Screen.width - BOX_WIDTH;
			GUI.Box(Rect(tooltipLocation.x, tooltipLocation.y, BOX_WIDTH, BOX_HEIGHT), "Unlabelled Lotline");
		} else if (linesLabelled && setback) { // If lines are labelled and line is a setback line
			if (Screen.height - tooltipLocation.y < 2*BOX_HEIGHT) tooltipLocation.y = Screen.height - BOX_HEIGHT;
			if (Screen.width - tooltipLocation.x < BOX_WIDTH) tooltipLocation.x = Screen.width - BOX_WIDTH;
			GUI.Box(Rect(tooltipLocation.x, tooltipLocation.y, BOX_WIDTH, 2*BOX_HEIGHT), lineType + 
			" Setback Line\nSetback Amount: " + sbAmount);
		} else { // Lines are labelled => line is a LotLine
			if (Screen.height - tooltipLocation.y < BOX_HEIGHT) tooltipLocation.y = Screen.height - BOX_HEIGHT;
			if (Screen.width - tooltipLocation.x < BOX_WIDTH) tooltipLocation.x = Screen.width - BOX_WIDTH;
			GUI.Box(Rect(tooltipLocation.x, tooltipLocation.y, BOX_WIDTH, BOX_HEIGHT), lineType + " Lotline");
		}
	}
}						

// These are all functions that provide variable values to this script. Pretty straightforward			
public function provideScriptInstance (p : Parcel) {
	parcelScript = p;
}
public function provideScriptInstance (sb : SetbackLines) {
	setbackScript = sb;
}
public function provideLineType (str : String) {
	lineType = str;
}
public function provideSetbackAmount (sb : float) {
	sbAmount = sb;
}