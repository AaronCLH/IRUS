#pragma strict

// The LandUseUI is the UI responsible for opening the InformationEditor, BUildingEditor, and ParcelEditor.  Each of these editors is a different layer and this script decides which layer to place on the top.  This script is also responsible for creating the ownership info and setback info objects for a particular parcel that is selected.  This is necessary for the editors to display informaition and also allow the user to change any information.  

private var SLIDE_SPEED : float = 200.0;

private var offsetLeft : float;
private var offsetTop : float;

private var uiAccessor : UIControl;

enum LandUseLayer {InformationEditor, BuildingEditor, ParcelEditor}  // WHich layer
private var NUM_LAYERS : int = 3;

private var layerOrder : LandUseLayer[];

private var informationEditor : LandUseUI_InformationEditor;  // Represents the script for Informaiton Editor
private var buildingEditor : LandUseUI_BuildingEditor; // Represents the script for Building Editor
private var parcelEditor : LandUseUI_ParcelEditor; // Represents the script for Parcel Editor

private var pbm : ParcelBuildingManager;
private var backend : Backend;
private var parcel : Parcel;
private var teranet : int;	// teranet number of the parcel
private var messageDisplay : MessageDisplay;
private var makingDecision : boolean;	// when user is deciding to save or discard

private function enableLayers () {
	informationEditor.enabled = true;
	buildingEditor.enabled = true;
	parcelEditor.enabled = true;
}

private function disableLayers () {
	informationEditor.enabled = false;
	buildingEditor.enabled = false;
	parcelEditor.enabled = false;
}

function Awake () {
	layerOrder = new LandUseLayer[NUM_LAYERS];
	for (var i : int = 0; i < NUM_LAYERS; i++) {
		layerOrder[i] = i;
	}
	informationEditor = gameObject.GetComponent(LandUseUI_InformationEditor);
	buildingEditor = gameObject.GetComponent(LandUseUI_BuildingEditor);
	parcelEditor = gameObject.GetComponent(LandUseUI_ParcelEditor);
	disableLayers();
}

function Start () {	
	uiAccessor = gameObject.GetComponent(UIControl);
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
	pbm = GameObject.Find(ParcelBuildingManager.SCRIPT_HOST).GetComponent(ParcelBuildingManager);
	messageDisplay = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	pbm.enableDetection();
}

function OnEnable () {
	offsetLeft = 0;
	offsetTop = 0;
	teranet = -1;
	hidden = false;
	if (pbm != null) {
		pbm.enableDetection();
	}
	enableLayers();
	pushLayerToTop(LandUseLayer.InformationEditor);
}

// Draw layer is responsible for drawing one of the Information Editor, Building Editor or Parcel Editor.  
private function drawLayer (l : LandUseLayer, isTop : boolean) {
	var rect : Rect;
	switch (l) {
	case LandUseLayer.InformationEditor:
		informationEditor.setOnTop(isTop);
		rect = informationEditor.drawFrame();
		break;
	case LandUseLayer.BuildingEditor:
		buildingEditor.setOnTop(isTop);
		rect = buildingEditor.drawFrame();
		break;
	case LandUseLayer.ParcelEditor:
		parcelEditor.setOnTop(isTop);
		rect = parcelEditor.drawFrame();
		break;
	}
	rect.x += offsetLeft;
	rect.y += offsetTop;
	if (rect.Contains(Vector2(Input.mousePosition.x, Screen.height-Input.mousePosition.y))) {
		CursorLock.SetMouseOnGUI();
	}
}

private function drawLayers () {
	for (var i : int = 0; i < NUM_LAYERS-1; i++) {
		drawLayer(layerOrder[i], false);
	}
	drawLayer(layerOrder[NUM_LAYERS-1], true);
}

// Allows you to push the appropriate editor to the top.  
public function pushLayerToTop (l : LandUseLayer) {
	Debug.Log(l);
	var found : boolean = false;
	for (var i : int = 0; i < NUM_LAYERS; i++) {
		if ((found || l == layerOrder[i]) && i != NUM_LAYERS-1) {
			found = true;
			var temp : LandUseLayer = layerOrder[i+1];
			layerOrder[i+1] = l;
			layerOrder[i] = temp;
		}
	}
}

private var hidden : boolean;

public function hide () {
	hidden = true;
}

public function show () {
	hidden = false;
}

// controller of all pieces
function OnGUI () {
	// if processing a request or there is a prompt that requires user's response, disable GUI
	if (backend.isProcessing() || makingDecision) {
		GUI.enabled = false;
	} else {
		GUI.enabled = true;
	}
	GUI.color.a = 0.95;
	if (!hidden) {
		drawLayers();
	} else {
		GUI.enabled = true;
		if (GUI.Button(new Rect(0,0,25,Screen.height), ">")) {
			show();
		}
		if (Rect(0,0,25,Screen.height).Contains(Vector2(Input.mousePosition.x, Screen.height-Input.mousePosition.y))) {
			CursorLock.SetMouseOnGUI();
		}
	}
}

function Update () {
	// building/parcel selecting
	if (Input.GetMouseButtonDown(0) &&									// left click
			!CursorLock.MouseIsOnGUI() &&									// is the mouse on some other gui or texture ?
				//!backend.isProcessing() &&								// is backend communicating with the backend application ?
					pbm.getDetectedParcel() != parcel &&				// is the user clicking on a different parcel/building ?
						!makingDecision &&								// is the user making decision on save or discard ?
							CursorLock.CameraLocked()) {					// is the user in camera-fixed mode ?
		
		if (informationEditor.changed() || parcelEditor.changed()) {	// changes made
			makingDecision = true;
			pbm.disableDetection();
			pushChangedLayer();
			messageDisplay.addMessage("Changes have been made. Would you like to save your changes?", gameObject,
										["Discard", "Continue Editing", "Save"],
										["discardAndSelectNext", "remainUnchanged", "saveAndSelectNext"],
										[void, void, void]);
		} else {	// otherwise just get the detected parcel and update the context
			newContext(pbm.getDetectedParcel());
		}
		
	}
}


// button function
public function remainUnchanged () {
	makingDecision = false;
	pbm.enableDetection();
}
// button function
public function discardAndSelectNext () {
	makingDecision = false;
	var oldParcel : Parcel = parcel;
	yield newContext(pbm.getDetectedParcel());
	oldParcel.stopVisual();
	pbm.enableDetection();
}
// button function
public function saveAndSelectNext () {
	makingDecision = false;
	yield saveContext();
	parcel.stopVisual();
	yield newContext(pbm.getDetectedParcel());
	pbm.enableDetection();
}




// save current context
private function saveContext () {
	informationEditor.saveContext();
	yield parcelEditor.saveContext();
}

// update context using the variable parcel
public function newContext (p : Parcel) {
	if (parcel != null) parcel.stopVisual();
	parcel = p;
	if (parcel != null) {
		if (parcel.getBuilding() != null) parcel.getBuilding().ghost();
		var oInfo : OwnershipInfo = new OwnershipInfo();  // Creates a new ownershipinfo object for this parcel that stores things like the address
		
		
		// Follows the new layered scheme for placing the parcels and buildings (i.e. Into the Uptown_Feb25)
		if (parcel.gameObject.name.Substring(0,6) == "Parcel")teranet = System.Convert.ToUInt64(parcel.gameObject.name.Substring(7,9));
		// Follows the old scheme which has parcel in Uptown Parcels and Buildings in Culling Objects.  This should be removed eventually. 
		else teranet = System.Convert.ToUInt64(parcel.gameObject.name);  // The PIN Number
		
		
		/*  Maybe do something like this in case the database query doesnt work.  You have to figure this out 
		
		// IF the information query is unsuccesful
		else {
			messageDisplay.addMessage("Sorry, we were not able to fetch the data...");
			quit();
			return;
		}
		*/
		
		// Sets the variables for the ownership info class.  Yield forces us to not proceed any further.  Must place in start Coroutine to use a function that contains a yield within this update
		
		yield StartCoroutine(oInfo.GetInfoFromDatabase(teranet.ToString()));
		Debug.Log(oInfo.Addresses[0]);
		informationEditor.newContext(teranet, oInfo);
		if (oInfo.Addresses.Length > 0) {
			buildingEditor.newContext(teranet, parcel, oInfo.Addresses[0]);
		} else {
			buildingEditor.newContext(teranet, parcel, "");
		}
		yield parcelEditor.newContext(parcel);
	} else {
		teranet = -1;
		informationEditor.newContext(-1, null);
		buildingEditor.newContext(-1, null, "");
		parcelEditor.newContext(null);
	}
}


// Close this UI
public function closeProcedure () {
	if (informationEditor.changed() || parcelEditor.changed()) {	// if changes made
		makingDecision = true;
		pushChangedLayer();
		messageDisplay.addMessage("Changes have been made. Would you like to save your changes?", gameObject,
									["Discard", "Continue Editting", "Save"],
									["quit", "remainUnchanged", "saveAndQuit"],
									[void, void, void]);
	} else {
		quit();
	}
}
// close this ui and open another one
public function closeAndOpenUI (ui : UI) {
	if (informationEditor.changed() || parcelEditor.changed()) {	// if changes made in ownership info frame
		makingDecision = true;
		pushChangedLayer();
		messageDisplay.addMessage("Opening another tool... but changes have been made here. Would you like to save your changes?", gameObject,
									["Discard", "Continue Editting", "Save"],
									["quitAndOpen", "remainUnchanged", "saveAndOpen"],
									[ui, void, ui]);
	} else {
		quitAndOpen(ui);
	}
}

private function pushChangedLayer () {
	if (informationEditor.changed()) {
		pushLayerToTop(LandUseLayer.InformationEditor);
	} else {
		pushLayerToTop(LandUseLayer.ParcelEditor);
	}
}

//button function
public function quitAndOpen (ui : UI) {
	var p : Parcel = parcel;
	quit();
	if (ui == UI.LineLabelling) {
		p.getSetbackInstance().startLabelling();
	} else {
		uiAccessor.openUI(ui);
	}
}
//button function
public function saveAndOpen (ui : UI) {
	makingDecision = false;
	yield saveContext();
	quitAndOpen(ui);
}
// button function
public function quit() {
	makingDecision = false;
	if (parcel != null) parcel.stopVisual();
	pbm.disableDetection();
	disableLayers();
	parcel = null;
	uiAccessor.closeUI(UI.LandUse);
}
// button function
public function saveAndQuit() {
	makingDecision = false;
	yield saveContext();
	quit();
}