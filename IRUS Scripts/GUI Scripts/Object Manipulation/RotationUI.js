//////////////////////////////////////////////// Rotation UI ///////////////////////////////////////////////////////////
//
// This script controls the rotation of specified objects, through user input. The idea is that either one object or
// an array of objects is given in to this script as noted below, and those objects are rotated using a small button
// that can be moved around a circle. The position of this button corresponds to the rotation of this object. There is
// also a spot for user inputted rotation in the middle of the tool.
//
// Note:
//
// * You must set RotationUI.UpdateObj = <GameObject to move> before opening this tool, or
//   else it will not work. Or you can set RotationUI.UpdateObjs = <Array of GameObjects to move>

#pragma strict

enum Rotation_ButtonStyle {done, reset, move, rotate} // Enumerations make things more clear

static var UpdateObj : GameObject; // The object to rotate
static var UpdateObjs : GameObject[]; // The objects to rotate. For Urban Design Editor when rotating all objects on a sidewalk
//public var testObj : GameObject; //// FOR TEST ONLY

public var font : Font;					// The font used in the tool
private var fontStyle : GUIStyle;		// The style used to represent this font
private var textfieldStyle : GUIStyle;	// The style used in the textfield

public var background : Texture2D; // Main background circle

// Textures to use for the buttons. Input the textures in the order done, reset, move, rotate.
private var NUM_BUTTONS : int = 4;
public var inactiveButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];
public var activeButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];
public var hoverButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];
private var buttonStyles : GUIStyle[] = new GUIStyle[NUM_BUTTONS]; 		// Styles govering the button placement

//Edit Objects Toolbar GUI
public var skin : GUISkin;
public var dottedLine : Texture2D;


private var SMALL_DIM : int = 40;	// The dimensions of the small circular button
private var BACK_DIM : int = 250;	// The dimensions of the large background circle

// Main programming logic variables
private var angle : float;			// The angle that the small circular button represents on the background circle
private var initAngle : float;		// The initial angle of the object(s) to rotate
private var bounds : Bounds;		// The bounds of UpdateObj
private var boundsArray : Bounds[];	// The bounds of UpdateObjs
private var rotButtonPos : Vector3;	// The Position on the screen of the small circular button
private var followMouse : boolean;	// Should the small rotation button be following the position of the mouse?

private var messageDisplayer : MessageDisplay; 
private var uiAccessor : UIControl; // All hail UIControl. All hail UIControl.

private var rotAngleStr : String; // The inputted angle string

private var CENTRE : Vector3 = new Vector3(Screen.width/2, Screen.height/2, 0); // The centre of the screen

private var ICON_RADIUS : float = 145.0; // The distance from the centre of the screen that the small button is always at

function Awake () {
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	uiAccessor = gameObject.GetComponent(UIControl);
}

function OnEnable () {
	//UpdateObj = Instantiate(testObj); //// FOR TEST ONLY
	var renderers : Component[];
	var B : Bounds;
	if (UpdateObj != null) { // If there is only one object
		renderers = UpdateObj.GetComponentsInChildren(MeshRenderer);
		B = (renderers[0] as MeshRenderer).bounds;	// should have at least 1 renderer
		for (var j : int = 1; j < renderers.Length; j++) {
			B.Encapsulate((renderers[j] as MeshRenderer).bounds); // Increase the bounds to include the bounds of each renderer
		}
		bounds = B;
		angle = UpdateObj.transform.eulerAngles.y;
		initAngle = angle;
	} else if (UpdateObjs != null) { // If there are multiple objects
		var numObjects: int = UpdateObjs.length;
		boundsArray = new Bounds[numObjects];
		for (var i : int = 0; i < UpdateObjs.length; i++) {
			renderers = UpdateObjs[i].GetComponentsInChildren(MeshRenderer);
			B = (renderers[0] as MeshRenderer).bounds;	// should have at least 1 renderer
			for (j = 1; j < renderers.Length; j++) {
				B.Encapsulate((renderers[j] as MeshRenderer).bounds); // Increase the bounds to include the bounds of each renderer
			}
			boundsArray[i] = B;
		}
		angle = UpdateObjs[0].transform.eulerAngles.y;
		initAngle = angle;
	}
	
	rotButtonPos = getButtonPos(angle);
	rotAngleStr = "";
	followMouse = false; // Don't follow the mouse initially
}

private var previousScreenSize : Vector2;
function Update () {
	CENTRE = new Vector3(Screen.width*0.5, Screen.height*0.5, 0); // Screen size is recalculated in case player becomes fullscreen.
	
	// This is to rotate the object if enter is pressed down or the newline character is detected in the textfield
	if (rotAngleStr != "" && (Input.GetButtonDown("Enter") || rotAngleStr.Contains("\n"))) {
		rotAngleStr = rotAngleStr.Replace("\n", ""); // Remove newline character from the inputted angle, if it's there.
		try {
			angle = (angle + parseFloat(rotAngleStr) % 360 + 360) % 360; // mod 360 in case angle > 360 (eulerAngles work best between 0 and 360)
			updateAngles(angle);
			rotButtonPos = getButtonPos(angle); // To keep the little rotate button updated with the object's rotation
		} catch (err) {
			messageDisplayer.addMessage("The inputted angle is not a number!");
		}
	}
	
	if (followMouse) { // If the mouse is being followed
		angle = getAngle(Input.mousePosition - CENTRE);
		rotButtonPos = getButtonPos(angle);
		updateAngles(angle);
	} else {
		if (previousScreenSize != Vector2(Screen.width, Screen.height)) {
			rotButtonPos = getButtonPos(angle); // Adjust the button position if the screen size changes
			previousScreenSize = new Vector2(Screen.width, Screen.height);
			Debug.Log("changed");
		}
	}
	if (Input.GetMouseButtonUp(0)) { // If left-click is released, no longer follow the button
		followMouse = false;
	}
}

function OnGUI() {
	if (buttonStyles[0] == null) { // This sets all the GUIStyles in this function...I had not yet fully discovered GUISkins...
		for (var i : int = 0; i < NUM_BUTTONS; i++) {
			buttonStyles[i] = new GUIStyle(GUI.skin.label);
			buttonStyles[i].active.background = buttonStyles[i].onActive.background = activeButtons[i];
			buttonStyles[i].normal.background = buttonStyles[i].onNormal.background = inactiveButtons[i];
			buttonStyles[i].hover.background = buttonStyles[i].onHover.background = hoverButtons[i];
		}
		fontStyle = new GUIStyle(GUI.skin.label);
		fontStyle.font = font;
		textfieldStyle = new GUIStyle(GUI.skin.textField);
		textfieldStyle.alignment = TextAnchor.MiddleCenter;
		textfieldStyle.fontSize = 30;
	}
	
	
	GUI.Label(Rect(CENTRE.x-BACK_DIM*0.5, CENTRE.y-BACK_DIM*0.5, BACK_DIM, BACK_DIM), background);	
	if (GUI.RepeatButton(Rect(rotButtonPos.x - SMALL_DIM*0.5, Screen.height - rotButtonPos.y - SMALL_DIM*0.5, 
				SMALL_DIM, SMALL_DIM), "", buttonStyles[Rotation_ButtonStyle.rotate])) { // If the button is clicked on, follow the mouse position
		followMouse = true;
	}
	
	// These three GUI Elements are all hard-coded relevant to the centre position to properly position the buttons 
	// on the background texture, as in the mock-ups.
	rotAngleStr = GUI.TextField(Rect(CENTRE.x-34, CENTRE.y-22, 62, 43), rotAngleStr, 5, textfieldStyle);
	if (GUI.Button(Rect(CENTRE.x-33, CENTRE.y-60, 60, 32), "", buttonStyles[Rotation_ButtonStyle.done])) {
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		closeProcedure();
	} else if (GUI.Button(Rect(CENTRE.x-33, CENTRE.y+28, 60, 32), "", buttonStyles[Rotation_ButtonStyle.reset])) {
		angle = initAngle;
		updateAngles(initAngle);
		rotButtonPos = getButtonPos(initAngle);
	}
}

// Closes the procedure correctly.
private function closeProcedure() {
	UpdateObj = null;
	UpdateObjs = null;
	// Set the tool selected to none for both scripts
	EditObjectsUI.selectedTool = SelectedTool.None;
	EditBuildingUI.selectedTool = SelectedTool.None;
	StreetFurnitureUI.selectedTool = SelectedTool.None;
	uiAccessor.closeUI(UI.Rotation);
}

// Adjusts the angles of the object(s) to rotate. Can handle one or multiple objects.
private function updateAngles (ang : float) {
	if (UpdateObj != null) {
		UpdateObj.transform.RotateAround(bounds.center, Vector3.up, ang-UpdateObj.transform.eulerAngles.y);
	} else {
		for (var i : int = 0; i < UpdateObjs.length; i++) {
			UpdateObjs[i].transform.RotateAround(boundsArray[i].center, Vector3.up, ang-UpdateObjs[i].transform.eulerAngles.y);
		}
	}
	GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
}			

// Gets the angle made by the position away from the centre, diff.
private function getAngle(diff : Vector3) {
	var ang : float;
	ang = Mathf.Rad2Deg*Mathf.Atan2(diff.x, diff.y);
	if (ang < 0) ang += 360;
	return ang;
}

// Produces the position to place the little circular rotation button.
private function getButtonPos(ang : float) {
	var bPos : Vector3;
	if (Mathf.Approximately(ang, 90)) bPos = Vector3(1, 0, 0);
	else if (Mathf.Approximately(ang, 270)) bPos = Vector3(-1, 0, 0);
	else if ((ang >= 0 && ang < 90) || (ang > 270 && ang <= 360))
		bPos = Vector3(Mathf.Tan(ang*Mathf.Deg2Rad), 1, 0);
	else bPos = Vector3(-Mathf.Tan(ang*Mathf.Deg2Rad), -1, 0);
	bPos = CENTRE + bPos/bPos.magnitude * ICON_RADIUS;
	return bPos;
}