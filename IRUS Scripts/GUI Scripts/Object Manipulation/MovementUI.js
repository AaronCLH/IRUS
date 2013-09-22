
//////////////////////////////////////////////// Movement UI ///////////////////////////////////////////////////////////
//
// This script controls the movement of specified objects, through user input. The idea is that either one object or
// an array of objects is given in to this script as noted below, and those objects are moved according to a rotating
// set of arrows that are rotated based on the y-rotation of the First Person Controller GameObject. This is done so that
// the direction in which each arrow points at any given time is the direction in which the building moves. This script
// contains a reference to UIControl so that this tool can close itself, and also so that it can open the rotation tool.
//
// Notes: 
// * In usability testing, you may want to determine what the best speeds are for SLOW_MOVE and FAST_MOVE. 
//
// * You must set MovementUI.UpdateObj = <GameObject to move> before opening this tool, or
//   else it will not work. Or you can set MovementUI.UpdateObjs = <Array of GameObjects to move>

#pragma strict

static var UpdateObj : GameObject; // The object to move 
static var UpdateObjs : GameObject[]; // The objects to move, for Urban Design Purposes
//public var testObj : GameObject; ////FOR TEST ONLY

private enum Movement_ArrowStyle {up, down, left, right} // Enumeration for the GUIStyles related to move arrow buttons
private enum Movement_ButtonStyle {done, reset, rabbit, turtle, rotate} // Enumeration for the GUIStyles related to the inner buttons

public var background : Texture2D; // Background for inner part of movement tool
public var dottedLine : Texture2D; // Dotted line for inner part of tool

public var font : Font; // Font used in inner GUI element
private var fontStyle : GUIStyle; // GUIStyle for each standalone text element in the GUI

// Make sure to provide textures in the order up, down, left, then right.
public var inactiveMoveButtons : Texture2D[] = new Texture2D[4]; 	// Normal and OnNormal textures for the arrows
public var activeMoveButtons : Texture2D[] = new Texture2D[4];		// Active and OnActive textures for the arrows
public var hoverMoveButtons : Texture2D[] = new Texture2D[4];		// Hover and OnHover textures for the arrows
private var moveButtonStyles : GUIStyle[] = new GUIStyle[4]; 		// Array holding all styles of arrow buttons

// Make sure to provide textures in the order done, reset, rabbit, turtle, rotate
private var NUM_BUTTONS : int = 5; 										// Number of inner buttons
public var inactiveButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];	// Normal and OnNormal textures for the inner buttons
public var activeButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];	// Active and OnActive textures for the inner buttons
public var hoverButtons : Texture2D[] = new Texture2D[NUM_BUTTONS];		// Hover and OnHover textures for the inner buttons
private var buttonStyles : GUIStyle[] = new GUIStyle[NUM_BUTTONS];		// Array holding all styles of inner buttons

private var BACK_DIM : int = 180;			// Dimensions of the background button
private var BUTTON_DIM : int = 60;			// Dimensions of the movement arrows
private var DIST_FROM_CENTRE : int = 160;	// The distance from the centre of the arrow buttons to the centre of the screen

private var TEXT_LAB_HEIGHT : int = 30;		// Height of the "VERTICAL" text button
private var TEXT_LAB_WIDTH : int = 90;		// Width of the "VERTICAL" text button

private var rotAngle : float;				// Rotation angle of the 4 arrows controlling the planar movement of the object
private var unitsToMove : float;			// The speed, in m/s, that the object to move is moving. Determined by SLOW_MOVE and FAST_MOVE
private var fpc : GameObject;				// Reference to the First Person Controller GameObject
private var uiAccessor : UIControl;			// Reference to UIControl to handle opening/closing UIs
private var initPosition : Vector3;			// Initial position of the single object
private var initPositions : Vector3[];		// Initial position of multiple game object (if multiple objects are needed to be moved)
private var CENTRE : Vector2;				// The centre of the screen

public var SLOW_MOVE : float = 1.0;			// The speed, in m/s, at which the game object will move when it is moving slowly
public var FAST_MOVE : float = 30.0;		// The speed, in m/s, at which the game object will move when it is moving quickly

// Called whenever the script is enabled. The interface is turned on and off through enabling and disabling
function OnEnable () {	
	//UpdateObj = Instantiate(testObj); //// FOR TEST ONLY	
	unitsToMove = SLOW_MOVE;
	fpc = GameObject.Find("First Person Controller");	
	uiAccessor = gameObject.GetComponent(UIControl);
	
	// This section is to handle setting the initial position(s) of the object(s). It is handled differently if it is a single object
	// compared to if it is multiple objects.
	if (UpdateObj != null) {
		initPosition = UpdateObj.transform.position;
	} else if (UpdateObjs != null) {
		initPositions = new Vector3[UpdateObjs.length];
		for (var i : int = 0; i < UpdateObjs.length; i++) {
			initPositions[i] = UpdateObjs[i].transform.position;
		}
	}
	
}

function Update () {
	CENTRE = new Vector2(Screen.width/2, Screen.height/2); // Need to move the center if the user adjusts the screen size on runtime.
}

function OnGUI() {
	
	// This is to give all the buttons their active, hover, and normal background textures.
	if (moveButtonStyles[0] == null) {
		for (var i : int = 0; i < NUM_BUTTONS; i++) {
			if (i < 4) {
				moveButtonStyles[i] = new GUIStyle(GUI.skin.label);
				moveButtonStyles[i].active.background = moveButtonStyles[i].onActive.background = activeMoveButtons[i];
				moveButtonStyles[i].normal.background = moveButtonStyles[i].onNormal.background = inactiveMoveButtons[i];
				moveButtonStyles[i].hover.background = moveButtonStyles[i].onHover.background = hoverMoveButtons[i];
			}
			buttonStyles[i] = new GUIStyle(GUI.skin.label);
			buttonStyles[i].active.background = buttonStyles[i].onActive.background = activeButtons[i];
			buttonStyles[i].normal.background = buttonStyles[i].onNormal.background = inactiveButtons[i];
			buttonStyles[i].hover.background = buttonStyles[i].onHover.background = hoverButtons[i];
		}
		// This sets the font style
		fontStyle = new GUIStyle(GUI.skin.label);
		fontStyle.font = font;
	}
	
	// Background box holding all centre GUI elements
	GUI.Label(Rect(CENTRE.x-BACK_DIM*0.5+3, CENTRE.y-BACK_DIM*0.5, BACK_DIM, BACK_DIM), background);
	
	// 2 non-interactive labels to add visual appeal and description
	GUI.Label(Rect(CENTRE.x-BACK_DIM*0.5+10, CENTRE.y+27, BACK_DIM-20, 40), dottedLine);
	GUI.Label(Rect(CENTRE.x-BACK_DIM*0.5+33, CENTRE.y+40, 130, 45), "MOVEMENT", fontStyle);
	
	// 5 main centre buttons in the UI
	if (GUI.Button(Rect(CENTRE.x-BACK_DIM*0.5+15, CENTRE.y-BACK_DIM*0.5+12, 90, 45), "", buttonStyles[Movement_ButtonStyle.reset])) {
		// Sets the position(s) of the object(s) to the initial position(s)
		if (UpdateObj != null) {
			UpdateObj.transform.position = initPosition;
		} else {
			for (i = 0; i < UpdateObjs.length; i++) {
				UpdateObjs[i].transform.position = initPositions[i];
			}
		}
	} 
	if (GUI.Button(Rect(CENTRE.x-BACK_DIM*0.5+15, CENTRE.y-BACK_DIM*0.5+67, 90, 45), "", buttonStyles[Movement_ButtonStyle.done])) {
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		closeProcedure(); // Closes the movement interface
	}
	if (GUI.Button(Rect(CENTRE.x+27, CENTRE.y-BACK_DIM*0.5+12, 45, 45), "", buttonStyles[Movement_ButtonStyle.rabbit])) {
		unitsToMove = FAST_MOVE; // Changes the speed of movement to FAST_MOVE m/s
	}
	if (GUI.Button(Rect(CENTRE.x+27, CENTRE.y-BACK_DIM*0.5+67, 45, 45), "", buttonStyles[Movement_ButtonStyle.turtle])) {
		unitsToMove = SLOW_MOVE; // Changes the speed of movement to SLOW_MOVE m/s
	}
	/*
	if (GUI.Button(Rect(CENTRE.x+28, CENTRE.y+35, 45, 45), "", buttonStyles[Movement_ButtonStyle.rotate])) {
		RotationUI.UpdateObj = UpdateObj;
		RotationUI.UpdateObjs = UpdateObjs;
		uiAccessor.closeUI(UI.Movement);
		uiAccessor.openUI(UI.Rotation);
	}
	*/	
	rotAngle = 360 - fpc.transform.eulerAngles.y; // Need to invert the rotation angle of the arrows because of how unity does angles
	
	// 4 arrow buttons that get rotated according to the rotation of the First Person Controller, so that each arrow always points in
	// the direction that the building will move
	GUIUtility.RotateAroundPivot(rotAngle,CENTRE);
	if(GUI.RepeatButton(Rect(CENTRE.x - BUTTON_DIM*0.5, CENTRE.y - (DIST_FROM_CENTRE + BUTTON_DIM*0.5), BUTTON_DIM, BUTTON_DIM), 
	"", moveButtonStyles[Movement_ArrowStyle.up])) {
		translate(new Vector3(0, 0, unitsToMove*Time.deltaTime)); // Moves in the positive z-direction
	}
	if(GUI.RepeatButton(Rect(CENTRE.x + (DIST_FROM_CENTRE - BUTTON_DIM*0.5), CENTRE.y - BUTTON_DIM*0.5, BUTTON_DIM, BUTTON_DIM),
	"", moveButtonStyles[Movement_ArrowStyle.right])) {
		translate(new Vector3(unitsToMove*Time.deltaTime, 0, 0)); // Moves in the positive x-direction
	}
	if(GUI.RepeatButton(Rect(CENTRE.x - BUTTON_DIM*0.5, CENTRE.y + (DIST_FROM_CENTRE - BUTTON_DIM*0.5), BUTTON_DIM, BUTTON_DIM), 
	"", moveButtonStyles[Movement_ArrowStyle.down])) {
		translate(new Vector3(0, 0, -unitsToMove*Time.deltaTime)); // Moves in the negative z-direction
	}
	if(GUI.RepeatButton(Rect(CENTRE.x - (DIST_FROM_CENTRE + BUTTON_DIM*0.5), CENTRE.y - BUTTON_DIM*0.5, BUTTON_DIM, BUTTON_DIM), 
	"", moveButtonStyles[Movement_ArrowStyle.left])) {
		translate(new Vector3(-unitsToMove*Time.deltaTime, 0, 0)); // Moves in the negative x-direction
	}		
	GUIUtility.RotateAroundPivot(-rotAngle, CENTRE); // Stop the rotation of the GUI by rotating it in the negative direction
	
	// 2 buttons for the vertical movement (in case the object has "basement" or "underground" vertices).
	// Hard-coded to make it fit.
	if (GUI.RepeatButton(Rect(Screen.width - 1.5*BUTTON_DIM, CENTRE.y - 1.15*BUTTON_DIM, BUTTON_DIM, BUTTON_DIM), "", 
	moveButtonStyles[Movement_ArrowStyle.up])) {
		translate(new Vector3(0, unitsToMove*Time.deltaTime, 0)); // Moves in the positive y-direction
	}
	if (GUI.RepeatButton(Rect(Screen.width - 1.5*BUTTON_DIM, CENTRE.y + 0.15*BUTTON_DIM, BUTTON_DIM, BUTTON_DIM), "",
	moveButtonStyles[Movement_ArrowStyle.down])) {
		translate(new Vector3(0, -unitsToMove*Time.deltaTime, 0)); // Moves in the negative y-direction
	}
	
	// Text indicating vertical move buttons
	GUIUtility.RotateAroundPivot(-90, new Vector2(Screen.width - 1.5*BUTTON_DIM - TEXT_LAB_HEIGHT, CENTRE.y + BUTTON_DIM*1.15));
	GUI.Label(Rect(Screen.width - 1.5*BUTTON_DIM, CENTRE.y + BUTTON_DIM*1.15, TEXT_LAB_WIDTH, TEXT_LAB_HEIGHT), "VERTICAL", fontStyle);
		
}	

// Closes the procedure correctly
private function closeProcedure() {
	UpdateObj = null;
	UpdateObjs = null;
	// Set the tool selected to none for both scripts
	EditObjectsUI.selectedTool = SelectedTool.None;
	EditBuildingUI.selectedTool = SelectedTool.None;
	uiAccessor.closeUI(UI.Movement);
}

// This function moves either one object or an array of objects in the direction of pos.
private function translate (pos : Vector3) {
	if (UpdateObj != null) {
		UpdateObj.transform.Translate(pos, Space.World); // Space.World needed to ensure the translation is in world space (rather than local space)
	} else {
		for (var obj : GameObject in UpdateObjs) {
			obj.transform.Translate(pos, Space.World);
		}
	}
	GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
}