////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//												LINE LABELLING UI
//
// This script handles the interface which allows the user to label the lotlines. This script requires, upon opening, a 
// CurrentParcel and CurrentSetbacks. Otherwise, the labelling will occur in the wrong location. This menu is opened through
// the parcel editor.
//

#pragma strict

static var CurrentParcel : Parcel;			// The parcel being operated on
static var CurrentSetbacks : SetbackLines;	// The setback lines instance that is being used

public var setbackIcon : GameObject;		// The prefab SetbackIcon GameObject that has a GUITexture attached
public var skin : GUISkin;					// The skin for the UI
public var folder : Texture2D;				// The folder containing the buttons
public var parcelIcon : Texture2D;			// The little graphic that looks liek a parcel in the middle of the folder

private var guiClicked : boolean;			// Has a GUITexture been clicked?

private var scale : float;					// The relative size of the GUITexture GameObjects

private var icons : GameObject[];			// An array which stores instances of setbackIcon

private var uiAccessor : UIControl;					// A reference to UIControl. All hail UIControl
private var landuseUI : LandUseUI;					// A reference to the LandUseUI Script
private var messageDisplayer : MessageDisplay;		// Allows us to display messages to the user
private var parcelEditor : LandUseUI_ParcelEditor;	// A reference to the Parcel Editor
private var backend : Backend;						// Allows us to read to and write from the database

private var mainCamera : Camera;			// The main camera object
private var fpc : GameObject;				// The First Person Controller GameObject

private var PIXEL_DIM : int = 64;			// Size of the GUITexture, in pixels
private var MAX_VIEW_DIST : int = 85;		// The maximum distance from which you can view the textures
private var FAST_FADE_DIST : int = 70;		// The distance at which the textures fade rapidly
private var SLOW_FADE_DIST : int = 20;		// The distance at which the textures begin to fade
private var HEIGHT_OFFSET : float = 0.5;	// The height above the lot lines that the icons are sitting at

private var FOLDER_DIM : Vector2 = new Vector2(265.0, 150.0); // The dimensions of the main folder
private var TOP_LEFT : Vector2 = new Vector2(15.0, 15.0);	  // The top left of the folder
private var TOGGLE_DIM : int = 20;							  // The dimensions of the toggle buttons

function OnEnable () { // Called whenever this script is enabled
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
	var uiGO : GameObject;
	uiGO = GameObject.Find(UIControl.SCRIPT_HOST);
	uiAccessor = uiGO.GetComponent(UIControl);
	landuseUI = uiGO.GetComponent(LandUseUI);
	parcelEditor = uiGO.GetComponent(LandUseUI_ParcelEditor);
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	icons = new GameObject[CurrentSetbacks.numLines];	
	mainCamera = GameObject.Find("Main Camera").GetComponent(Camera);
	fpc = GameObject.Find("First Person Controller");
	
	guiClicked = false;
	
	var guiPoint : Vector3;
	for (var i : int = 0; i < icons.length; i++) {
		guiPoint = CurrentSetbacks.getLotLines()[i].getLine().getCenter();
		icons[i] = Instantiate(setbackIcon, worldToGUIPos(guiPoint), Quaternion.identity); // Instantiate icons in the 
																						   // appropriate location
	}
    
}

function Update () {
	if (SetbacksGUITexture.SelectedTexture == null) guiClicked = false; // If a Texture is not clicked on, guiClicked is false
	else guiClicked = true;												// Otherwise, it is true
	
	// This block of code calculates the approximate center of the parcel												
	var newCentre : Vector3;
	for (var i : int = 0; i < icons.length; i++) {
		newCentre = newCentre + CurrentSetbacks.getLotLines()[i].getLine().getCenter();
	}
	newCentre = newCentre/icons.length;	
	
	// This block determines the size that the GUITextures should be shown as, using the reciprocal of a logarithmic scale.
	// You can adjust MAX_VIEW_DIST, FAST_FADE_DIST, and SLOW_FADE_DIST to your liking, but I wouldn't adjust these formulae
	// if I were you. These work well for whatever reason.
	scale = scaleFactor(newCentre);	
	for (i = 0; i < icons.length; i++) {
		var centre : Vector3 = CurrentSetbacks.getLotLines()[i].getLine().getCenter();
		if (behindFPC(centre) || scale > MAX_VIEW_DIST) {
			icons[i].active = false;
		} else {
			icons[i].active = true;
			icons[i].transform.position = worldToGUIPos(centre);
			var guiTex : GUITexture = icons[i].GetComponent(GUITexture);
			if (scale > FAST_FADE_DIST) {
				var newDim1 : float = PIXEL_DIM * (MAX_VIEW_DIST - scale) / 
					((Mathf.Log(FAST_FADE_DIST) - Mathf.Log(SLOW_FADE_DIST) + 1) * (MAX_VIEW_DIST - FAST_FADE_DIST));
				guiTex.pixelInset = Rect(-newDim1*0.5, -newDim1*0.5, newDim1, newDim1);
			} else if (scale > SLOW_FADE_DIST) {
				var newDim : float = PIXEL_DIM/(Mathf.Log(scale) - Mathf.Log(20) + 1);
				guiTex.pixelInset = Rect(-newDim*0.5, -newDim*0.5, newDim, newDim);
			} else {
				guiTex.pixelInset = Rect(-PIXEL_DIM*0.5, -PIXEL_DIM*0.5, PIXEL_DIM, PIXEL_DIM);
			}
		}			 
	}
				
}

function OnGUI() {
	if (guiClicked) {
		for (var i : int = 0; i < icons.length; i++) { // Find which GUITexture has been clicked on, and call labelType on that
													   // index in the array
			if (SetbacksGUITexture.SelectedTexture == icons[i]) {
				labelType(i);
			}
		}
	}
}

// This is a helper function for OnGUI(). It takes as input a position in an array, i, and labels the lotline in position i in 
// CurrentSetbacks.Lotlines according to user input.
private function labelType(i : int) {
	GUI.skin = skin;
	
	GUI.DrawTexture(Rect(TOP_LEFT.x, TOP_LEFT.y, FOLDER_DIM.x, FOLDER_DIM.y), folder);
	GUI.DrawTexture(Rect(TOP_LEFT.x + 70, TOP_LEFT.y + 47, 50, 50), parcelIcon);
	
	GUI.Label(Rect(TOP_LEFT.x + 7, TOP_LEFT.y + 55, 100, 25), "SIDE");
	GUI.Label(Rect(TOP_LEFT.x + 73, TOP_LEFT.y + 5, 100, 25), "REAR");
	GUI.Label(Rect(TOP_LEFT.x + 70, TOP_LEFT.y + 123, 100, 25), "FRONT");
	GUI.Label(Rect(TOP_LEFT.x + 146, TOP_LEFT.y + 55, 100, 25), "FLANKAGE");	
	GUI.Label(Rect(TOP_LEFT.x + 161, TOP_LEFT.y + 100, 100, 22), "All Labelled");
	GUI.Label(Rect(TOP_LEFT.x + 161, TOP_LEFT.y + 124, 100, 22), "Close");
	
	if (GUI.Button(Rect(TOP_LEFT.x + 45, TOP_LEFT.y + 55, TOGGLE_DIM, TOGGLE_DIM), "", "Selector Button")) { // Side
		CurrentSetbacks.addLabel(SetbackLines.LINE_TYPES[LineType.Side], i);
	}
	if (GUI.Button(Rect(TOP_LEFT.x + 85, TOP_LEFT.y + 25, TOGGLE_DIM, TOGGLE_DIM), "", "Selector Button")) { // Rear
		CurrentSetbacks.addLabel(SetbackLines.LINE_TYPES[LineType.Rear], i);
	}
	if (GUI.Button(Rect(TOP_LEFT.x + 85, TOP_LEFT.y + 100, TOGGLE_DIM, TOGGLE_DIM), "", "Selector Button")) { // Front
		CurrentSetbacks.addLabel(SetbackLines.LINE_TYPES[LineType.Front], i);
	}
	if (GUI.Button(Rect(TOP_LEFT.x + 124, TOP_LEFT.y + 55, TOGGLE_DIM, TOGGLE_DIM), "", "Selector Button")) { // Flankage
		CurrentSetbacks.addLabel(SetbackLines.LINE_TYPES[LineType.Flankage], i);
	}
	
	if (GUI.Button(Rect(TOP_LEFT.x + 138, TOP_LEFT.y + 100, 22, 22), "", "All Labelled")) {
		if (CurrentSetbacks.numLines > CurrentSetbacks.numLabels) { // If there are more lines than labels...
			messageDisplayer.addMessage("You have not labelled all of the lot lines!");
		} else { // If not, ask the user whether or not this parcel is an exception
			messageDisplayer.addMessage("Is this parcel an exception?", gameObject, ["Yes", "No"],
			                                              ["placeException", "placeNonException"],
			                                              	                         [void, void]);
		}
	}
	if (GUI.Button(Rect(TOP_LEFT.x + 138, TOP_LEFT.y + 124, 22, 22), "", "Close")) {
		messageDisplayer.addMessage("Current labels wil be lost. Discard changes?", gameObject, ["Yes", "No"],
																					   ["closeLabelling", ""],
																					   			 [void, void]);
	}	
} 

// This function handles the placement of setback lines for a parcel that the user has determined to be a non-exception. 
private function placeNonException() {
	var sInfo : SetbackInfo = new SetbackInfo(); 
	yield backend.sendRequest(["retrieve", CurrentParcel.gameObject.name, "SetbackInfo"]); // Read from the database
	if (backend.getResult() == null) { // Do nothing if the retrieve operation fails
		messageDisplayer.addMessage("Sorry, an attempt to retrieve the necessary data has failed.");
		return;
	} else if (backend.getResult() != "") {	// Otherwise if the data is not the empty string, decode it.
		sInfo.decodeFromJSON(backend.getResult());
	}
	var zoneData : ZoningInfo = ParseCSV.ZoneClasses.getZoningData(sInfo.ZoningClass); // Look up the zoning information table
	if (zoneData == null) { // If zone data is null, the the inputted zoning class is invalid. Prompts the user to select a
							// valid zoning class.
		messageDisplayer.addMessage("Please select a zoning class using the dropdown menus and try again");
		parcelEditor.forceExisting();
	} else { // Otherwise, the zoning class is valid, and this calls the doneLabellingNormal function in parcel editor
		yield parcelEditor.doneLabellingNormal(CurrentSetbacks.getEncodedRefs(), ReorderAmounts(zoneData.setbackAmounts),
																			zoneData.maxHeight, zoneData.minHeight);
	}
	closeLabelling();
}	

// This function handles the placement of setback lines for a parcel that the user has determined to be an exception.
private function placeException() {
	yield closeLabelling();
	parcelEditor.forceAmounts(); // Force the user to enter setback amounts
	messageDisplayer.
	addMessage("Enter the setback amounts, the zoning class, and the maximum and minimum heights.\nClick the save button when done.");
	parcelEditor.doneLabellingException(CurrentSetbacks.getEncodedRefs()); // Calls the doneLabellingException function
}

// This function closes this UI and opens the LandUseUI, with the ParcelEditor layer pushed to the top of the stack
private function closeLabelling() {	
	CurrentParcel.stopVisual();
	for (var go : GameObject in icons) Destroy(go);
	uiAccessor.closeUI(UI.LineLabelling);
	uiAccessor.openUI(UI.LandUse);
	yield landuseUI.newContext(CurrentParcel);
	landuseUI.pushLayerToTop(LandUseLayer.ParcelEditor);
}

// This function converts world position to GUI position, using WorldToScreenPoint.		
private function worldToGUIPos (pos : Vector3) {
	pos.y = pos.y + HEIGHT_OFFSET;
	pos = mainCamera.WorldToScreenPoint(pos);
	pos.x = pos.x / mainCamera.pixelWidth;
	pos.y = pos.y / mainCamera.pixelHeight;
	return pos;
}

// This function determines the scaleFactor, which helps in the sizing of the GUITextures.
private function scaleFactor (pos : Vector3) {
	var length : float = Vector3.Distance(fpc.transform.position, pos);
	return length;
}	

// This function determines whether or not a position, pos, is behind the First Person Controller, so that
// GUITextures are not improperly drawn on the screen when the FPC is facing away from the actual position.
private function behindFPC (pos : Vector3) {
	var v1 : Vector3 = pos - fpc.transform.position;
	var v2 : Vector3 = fpc.transform.forward;
	return Vector3.Dot(v1,v2) < 0;
}	

// This function is used in Parcel Editor, and is used to produce an array of distances based off of their positions
// in the reference array.
static function ReorderAmounts(numArray : float[]) {
	var refs : int[] = CurrentSetbacks.getEncodedRefs();
	var newArray : float[] = new float[refs.length];
	for (var i : int = 0; i < newArray.length; i++) {
		newArray[i] = numArray[refs[i]];
	}
	return newArray;
}