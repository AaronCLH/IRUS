// Cursor Script - For controlling the settings related to the Cursor 

#pragma strict

static var mouseLookOn : boolean = true;	// Can you look around with your cursor (i.e. is Screen.lockCursor true?)
static var mouseOnGUI : boolean = false;	// Is the cursor on a 2D GUI element?
static var mouseOnGUICounter : int = 0;		// The number of 2D GUI elements the cursor is on in each frame
private var fullscreen : boolean = false;	// Is the player in fullscreen mode?

function Update () {
	if (Input.GetButtonDown("Camera Lock Toggle")) {  // If right-click is selected, unlock the screen and disable the camera views
		MouseSet(!mouseLookOn);
	}
	Screen.lockCursor = mouseLookOn; // If screen.lockCursor is true, the cursor is hidden in the centre of the screen and controls
									 // viewpoints directly
	if (mouseOnGUICounter > 0) {
		mouseOnGUI = true;	// this means some script has detected that the mouse position is on a 2D GUI
							// and it would like broadcast this, so that other scripts can use MouseIsOnGUI() to check
							// if they should accept mouse click or something like that
		mouseOnGUICounter = 0;
	} else {
		mouseOnGUI = false;
	}
	if (Input.GetButtonDown("Fullscreen")) { // If the fullscreen button if selected
		if (!fullscreen) {
			Screen.SetResolution(9000, 9000, true);
			fullscreen = true;
		} else {
			Screen.SetResolution(750, 500, false);
			fullscreen = false;
		}
	}
}

// This function sets the ability to look around
static function MouseSet (bool : boolean) {
	mouseLookOn = bool;
	Screen.lockCursor = bool;
	GameObject.Find("First Person Controller").GetComponent(MouseLook).enabled = bool;
	GameObject.Find("Main Camera").GetComponent(MouseLook).enabled = bool;
}

// This function checks if the camera is locked
static function CameraLocked () {
	return !mouseLookOn;
}

// This function checks if the mouse is on a gui element in the frame
static function MouseIsOnGUI () {
	return mouseOnGUI;
}

// This function merely increments the counter
static function SetMouseOnGUI () {
	mouseOnGUICounter++;
	//Debug.Log("SetMouseOnGUI: " + mouseOnGUICounter);
}