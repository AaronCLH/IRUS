/////////////////////////////////////////// Parcel Editor /////////////////////////////////////////
//
// The purpose of this script is to control the Parcel Editor portion of the Land Use UI. There are
// many variables in this script, but I will attempt to explain each one wherever they are intialized.
// One of the most important parts of this script is the GUI Skin, as it contains many GUIStyles
// that are used in various places throughout the script.
//
///////////////////////////////////////////////////////////////////////////////////////////////////

#pragma strict

public var skin : GUISkin;   // The skin holding many GUIStyles. Should be the Parcel Editor Skin

public var folder : Texture2D;				// The background folder
public var dottedLine : Texture2D;			// The dotted line textures separating elements
public var dropDownBox : Texture2D;			// The texture for the background of the dropdown box and menu
public var buttonBackground : Texture2D;	// The texture that is the container for the lotline/setback line toggle buttons
public var sliderBackground : Texture2D;	// The long, vertical texture used as the vertical slider scale
public var encBackground : Texture2D;		// The large textbox used as the encumberances background
public var heightInput : Texture2D;			// The height input background box
				
private var TOP_LEFT : Vector2 = new Vector2(57.0, 15.0);		// The top left corner of the folder
private var FOLDER_DIM : Vector2 = new Vector2(358.0, 455.0);	// The x,y dimensions of the folder

private var ON_OFF_DIM : int = 30;			// The dimensions of any toggle button
private var SLIDER_DIM : int = 30;			// The dimensions of the small slider button
private var SMALL_MARGIN : int = 5;			// A small margin of 5 pixels, used when necessary

private var MOVE_SPEED : float = 1700.0;	// The speed, in pixels/second, that the folder moves when tab is clicked
private var moveUp : boolean;				// Should the folder be moving up?
private var moveDown : boolean;				// Should the folder be moving down?

private var maxHeight : float;				// The maximum height of the massing object
private var minHeight : float;				// The minimum height of the massing object

private var oldWhiteFontSize : int;			// A variable used when changing GUIStyles to hold the old font size

private var scenario : boolean;				// Is this an exception parcel?
private var existing : boolean;				// Is this a non-exception parcel?
private var showHeightLabel : boolean;		// Can the height label on the slider button be shown?
private var showMassing : boolean;			// Should the massing object be rendered?
private var userGivingAmounts : boolean;	// Is the user being forced to enter setback and height amounts?
private var scenarioAllowed : boolean;		// Can this be an exception parcel?
private var existingAllowed : boolean;		// Can this be a non-exception parcel?
private var labelled : boolean;				// Are the lot lines labelled?
private var zone1Menu : boolean;			// Is the zone prefix menu open?
private var zone2Menu : boolean;			// Is the zone suffix menu open?

private var lotLineToggles : boolean[] = new boolean[4];	// Array which is true if lotline type i is on for 0 <= i <= 3
private var setbackToggles : boolean[] = new boolean[4];	// Array which is true if setback type i is on for 0 <= i <= 3
private var lotLineStates : boolean[] = new boolean[4];		// Array used to detect changes in lotLineToggles
private var setbackStates : boolean[] = new boolean[4];		// Array used to detect changes in setbackToggles

private var changesMade : boolean;		// Have changes been made to text in the editor?
private var showGUI : boolean;			// Can the GUI be enabled?
private var prevGUI : boolean;			// The GUI.enabled state in LandUseUI
private var onTop : boolean;			// Is this editor on the top of the stack?

private var blackFontStyle : GUIStyle;	// A GUIStyle used for black font
private var whiteFontStyle : GUIStyle;	// A GUIStyle used for white font

private var buttonPos : Vector3;		// The position of the slider button
private var buttonHeight : int;			// The height of the massing, in metres, that the position of the slider button represents
private var oldButtonHeight : int;		// The previous buttonHeight. To detect changes in buttonHeight

private var NUM_INPUT_STRINGS : int = 8;								// The number of string inputs
private var currentStrings : String[] = new String[NUM_INPUT_STRINGS];	// The current values of these string inputs	
private var oldStrings : String[] = new String[NUM_INPUT_STRINGS];		// The old values of the string inputs. To detect changes
private var setbackInputs : float[] = new float[4];						// The parsed values of some of the currentString, 
																		// denoting setback amounts

private var zone1Str : String;							// The zone prefix
private var zone2Str : String;							// The zone suffix
private var oldZoneStrs : String[] = new String[2];		// The old zone prefixes and suffixes. To detect changes
private var zone2Choices : Array = new Array();			// The available choices for zone2Str, given the choices of zone1Str
private var ZONING_PREFIX : String[] = new String[4];	// Constant Zone prefix choices.
private var ZONE_END_C : String[] = new String[5];		// The suffixes if the prefix is "C"
private var ZONE_END_G : String[] = new String[3];		// The suffixes if the prefix is "G"
private var ZONE_END_MR : String [] = new String[4];    // The suffixes if the prefix is "MR-12" or "MR-25"
ZONING_PREFIX = ["C", "G", "MR-12 ", "MR-25 "];
ZONE_END_C = ["2", "6", "7", "8", "9"];
ZONE_END_G = ["", "3", "R2-4"];
ZONE_END_MR = ["Apartment", "Triplex", "Lodging House", "Non-residential"];

private var parcel : Parcel;					// Reference to the current parcel
private var setbacks : SetbackLines;			// Reference to the setback lines attached to the current parcel
private var massing : Massing;					// Reference to the massing attached to the current parcel
private var landuseUI : LandUseUI;				// Reference to LandUseUI script
private var uiAccessor : UIControl;				// Reference to UIControl
private var messageDisplayer : MessageDisplay;	// Allows messages to be displayed on-screen to the user
private var message : MessageID;				// A reference to a specific message (so that it is not repeated in OnGUI())
private var sInfo : SetbackInfo;				// An object storing relevant setback information
private var backend : Backend;					// A reference to the script that reads from and writes to the database

function Start () { // Called on Play
	landuseUI = gameObject.GetComponent(LandUseUI);
	uiAccessor = gameObject.GetComponent(UIControl);
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
	showGUI = false; // Do not show the GUI, by default
	for (var s : String in currentStrings) s = "";
	moveUp = moveDown = false;
}

function OnEnable() { // Called whenever UIControl opens the LandUseUI
	scenario = false;
	existing = false;
	newContext(null); // A parcel is not selected when the script is enabled
	buttonPos = getButtonPos(Input.mousePosition);
}	

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 												NEW CONTEXT 
//
// This function takes in a parcel, p, and produces void.
// If the parcel is null, the GUI is not shown, and most variables are set to either false or "".
// If the parcel is not null and there is valid setback information in the database, then that data is 
// pulled up and used to populate the fields inside of this editor.
// If the parcel is not null and there is no valid setback data, then a setting almost similar to a null
// parcel is entered, and the next logical step for the user would probably be to label lotlines.
//
public function newContext(p : Parcel) {
	
	// Set these state variables to false initially
	zone1Menu = zone2Menu = false;
	changesMade = false;
	showHeightLabel = false;
	userGivingAmounts = false;
	showMassing = false;
	
	if (setbacks != null) {
		setbacks.hideSetbacks();
		massing.hideMassing();
	}
	parcel = p;
	
	if (parcel == null) {
		newContextNullParcel();
	} 
	else { // p is not null
	
		setbacks = p.getSetbackInstance();
		massing = p.gameObject.GetComponent(Massing);
		
		sInfo = new SetbackInfo();
		yield backend.sendRequest(["retrieve", parcel.gameObject.name, "SetbackInfo"]); // Retrieve data from the database
		
		if (backend.getResult() == null) { // If this is the case, then the retrieve operation failed - usually from a server error
			messageDisplayer.addMessage("Sorry, we were unable to retrieve data for this parcel.");
			newContextEmpty();
			scenarioAllowed = existingAllowed = true; // Allow the user to have either the exception or non-exception mode
		} 
		else if (backend.getResult() != "") { // There is some data inside of the database already
			sInfo.decodeFromJSON(backend.getResult());
			
			if (sInfo.RefArray.length != 0) { // The data has a RefArray which represents the labels on the lot lines.
				newContextWithInfo(sInfo);
			} else { // There is no RefArray
				newContextNoRefs();
				scenarioAllowed = existingAllowed = true;
			}
			
			overallNewContextFromInfo(sInfo); // This can be called whether or not there is a RefArray
			
		} else { // There is no data in the database (the retrieval did not fail - just the database is empty
			newContextEmpty();
			scenarioAllowed = existingAllowed = true;
		}
	}
	
	resetStrings(); // Reset the string values
	setTogglesFalse();	// Set the toggle variables to false
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//													SAVE CONTEXT
// 
// This function has no inputs or outputs. The purpose of this function is to save the current data
// into the database.
//
public function saveContext() {
	if (sInfo == null) sInfo = new SetbackInfo(); // Create a SetbackInfo object to save the data if there isn't already one
	setTogglesFalse(); // This is done so that the setback lines don't move if there is a change in the setback values
	
	if (scenario) { // This parcel is an exception
		for (var i : int = 0; i < 4; i++) {
			setbackInputs[i] = parseInput(currentStrings[i+1]); // Get setback values using the parseInput function below
		}
		sInfo.IsException = true;
		sInfo.MinHeight = minHeight = parseInput(currentStrings[6]); // Parse the min and max heights using the same parseInput function
		sInfo.MaxHeight = maxHeight = parseInput(currentStrings[5]); 
		sInfo.DistArray = LineLabellingUI.ReorderAmounts(setbackInputs);  // This is to change the setback amounts to distances in-line with 
																	 // the current RefArray
		sInfo.ZoningClass = currentStrings[0];		
					
		if (!labelled && sInfo.RefArray.length == 0) { // If the lines are unlabelled and the length of the RefArray is zero,
			sInfo.RefArray = [];					   // make RefArray just an empty array
		} else {
			setbacks.useEncodedRefs(sInfo.RefArray, sInfo.DistArray); // Otherwise, set the setback amounts with the useEncodedRefs
			massing.recalculateMassing();							  // function, and recalculate the massing object
			buttonHeight = getButtonPos(Input.mousePosition, maxHeight, minHeight)[1];	
		}
		
		yield backend.sendRequest(["update", parcel.gameObject.name, "SetbackInfo", sInfo.encodeToJSON()]); // Update the database
		userGivingAmounts = false;
	} 
	else { // This parcel is not an exception - less to consider when saving
		if (!labelled && sInfo.RefArray.length == 0) sInfo.RefArray = [];
		sInfo.IsException = false;
		sInfo.Encumberances = currentStrings[7];
		sInfo.ZoningClass = combineZones(zone1Str, zone2Str);
		yield backend.sendRequest(["update", parcel.gameObject.name, "SetbackInfo", sInfo.encodeToJSON()]); // Update the database
	}
	resetStrings();
	changesMade = false;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Update () { // Mostly used to detect changes in the toggles and act accordingly

	showGUI = onTop && (parcel != null); // Check if we are able to enable the GUI
	
	if (!changesMade) { // If there were no changes made, check if there were changes made
		for (var i : int = 0; i < NUM_INPUT_STRINGS; i++) {
			if (currentStrings[i] != oldStrings[i]) {
				changesMade = true;
				break;
			}
		}				
	}
	
	if (existing) {
		if (((oldZoneStrs[0] != zone1Str) || (oldZoneStrs[1] != zone2Str)) && (zone1Str != "") && (zone1Str == "G" || zone2Str != "")
		&& !(zone1Menu || zone2Menu)) {
			if (sInfo == null) {
				sInfo = new SetbackInfo();
				sInfo.RefArray = [];
			}
			sInfo.ZoningClass = combineZones(zone1Str, zone2Str);
			oldZoneStrs[0] = zone1Str;
			oldZoneStrs[1] = zone2Str;
			var zoneData : ZoningInfo = ParseCSV.ZoneClasses.getZoningData(sInfo.ZoningClass); // Look up the zoning information table
			if (sInfo.RefArray.length != 0) {
				maxHeight = sInfo.MaxHeight = zoneData.maxHeight;
				minHeight = sInfo.MinHeight = zoneData.minHeight;
				LineLabellingUI.CurrentSetbacks = setbacks;
				sInfo.DistArray = LineLabellingUI.ReorderAmounts(zoneData.setbackAmounts);
			}
			changesMade = true;
		}
	}	
	
	if (massing != null) { // If the massing is not null, i.e. the parcel is not null
		if (showMassing && buttonHeight != 0 && (buttonHeight != oldButtonHeight || !massing.checkMassingState())) {
			// If the massing should be shown, and the button height is not zero, and either the button height has changed or the
			// massing is not being show, then show the massing and update the button height.
			massing.showMassing(buttonHeight);
			oldButtonHeight = buttonHeight;
		} else if ((!showMassing || buttonHeight == 0) && massing.checkMassingState()) {
			// Otherwise, if either the massing should not be shown or button height is zero, and the massing is being shown,
			// then hide the massing.
			massing.hideMassing();
		}
	}
	
	for (i = 0; i < 4; i++) { // Detects changes in the toggles
		if ((lotLineStates[i] != lotLineToggles[i]) && (lotLineToggles[i] == true)) { // A lotline toggle went from off to on
			lotLineStates[i] = true;
			proceedToShowLotLine(i);
		} else if (lotLineStates[i] != lotLineToggles[i]) { // A lotline toggle went from on to off
			lotLineStates[i] = false;
			setbacks.hideLLofType(i);
		}
		if ((setbackStates[i] != setbackToggles[i]) && (setbackToggles[i] == true)) { // A setback toggle went from off to on 
			setbackStates[i] = true;
			proceedToShowSetback(i);
		} else if (setbackStates[i] != setbackToggles[i]) { // A setback toggle went from on to off
			setbackStates[i] = false;
			setbacks.hideSetbackOfType(i);
		}
	}	
	
	if (moveDown) { // If the parcel folder should be moving down
		TOP_LEFT.y += MOVE_SPEED*Time.deltaTime; // Move the top left down until it reaches the point at which it must be moved up
		if (TOP_LEFT.y > 15.0 + FOLDER_DIM.y) {
			moveDown = false;
			moveUp = true;
			landuseUI.pushLayerToTop(LandUseLayer.ParcelEditor);
		}
	} else if (moveUp) { // If the parcel folder should be moving up, move the top left up until it reaches the original top left
		TOP_LEFT.y -= MOVE_SPEED*Time.deltaTime;
		if (TOP_LEFT.y < 15.0) {
			TOP_LEFT.y = 15.0;
			moveUp = false;
		}
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//														DRAW FRAME
//
// This function acts as the OnGUI() for this script and is called from within LandUseUI if this Editor is on top of the stack.
// For LandUseUI, you must return the rectange in which the folder is being drawn.
//
public function drawFrame() {
	GUI.skin = skin;
	
	if (blackFontStyle == null) { // This creates a black label style and a white label style 
		blackFontStyle = new GUIStyle(GUI.skin.label);
		blackFontStyle.normal.textColor = Color.black;
		whiteFontStyle = new GUIStyle(GUI.skin.label);
		whiteFontStyle.normal.textColor = Color.white;
	}
	
	prevGUI = GUI.enabled;          // Checks if the GUI is enabled from LandUseUI
	if (!prevGUI) showGUI = false;  // Disable the GUI if it is not enabled in LandUseUI
	
	GUI.enabled = showGUI;
	
		GUI.DrawTexture(Rect(TOP_LEFT.x, TOP_LEFT.y, FOLDER_DIM.x, FOLDER_DIM.y), folder);
		if (scenarioAllowed == false) {
			GUI.enabled = false;
			scenario = false;
		}
		// Toggle button denoting if this is an exception parcel
		scenario = GUI.Toggle(Rect(TOP_LEFT.x + 25, TOP_LEFT.y + SMALL_MARGIN, ON_OFF_DIM, ON_OFF_DIM), scenario, "");
		GUI.Label(Rect(TOP_LEFT.x + 58, TOP_LEFT.y + SMALL_MARGIN*1.5, 150, ON_OFF_DIM), "SCENARIO", whiteFontStyle);
	
	GUI.enabled = showGUI;
	
		if (existingAllowed == false) {
			GUI.enabled = false;
			existing = false;
		} else {
			existing = !scenario;
		}
		// Toggle button denoting if this is a non-exception parcel
		existing = GUI.Toggle(Rect(TOP_LEFT.x + 160, TOP_LEFT.y + SMALL_MARGIN, ON_OFF_DIM, ON_OFF_DIM), existing, "");
		GUI.Label(Rect(TOP_LEFT.x + 193, TOP_LEFT.y + SMALL_MARGIN*1.5, ON_OFF_DIM*3, ON_OFF_DIM), "EXISTING", whiteFontStyle);
	if (scenarioAllowed) scenario = !existing;
	
	GUI.enabled = showGUI;	
	
	GUI.DrawTexture(Rect(TOP_LEFT.x + 288, TOP_LEFT.y + 283, 68, 68), heightInput);
			
	GUI.DrawTexture(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + SMALL_MARGIN*2 + ON_OFF_DIM, 285, 5), dottedLine);
	GUI.DrawTexture(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 80, 285, 5), dottedLine);	
	GUI.DrawTexture(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 195, 285, 5), dottedLine);		
	GUI.DrawTexture(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 369, 285, 5), dottedLine);
	
	if (userGivingAmounts == true) GUI.enabled = false; // Disable the GUI if the user is being forced to enter setback and height amounts
	
		// Massing toggle button	
		showMassing = GUI.Toggle(Rect(TOP_LEFT.x + 324, TOP_LEFT.y + 5, ON_OFF_DIM, ON_OFF_DIM), showMassing, "");
			
		GUIUtility.RotateAroundPivot(90, Vector2(TOP_LEFT.x + 350, TOP_LEFT.y + 40));
			GUI.Label(Rect(TOP_LEFT.x + 350, TOP_LEFT.y + 40, 250, 30), "SET MASSING HEIGHT", blackFontStyle);
		GUIUtility.RotateAroundPivot(-90, Vector2(TOP_LEFT.x + 350, TOP_LEFT.y + 40));
		
		if (showMassing) {
			GUI.DrawTexture(Rect(TOP_LEFT.x + 303, TOP_LEFT.y + SMALL_MARGIN*2, 10, 250), sliderBackground);
			if (!moveUp) { 
				// If massing should be shown and the folder is not moving up
				if (GUI.RepeatButton(Rect(buttonPos.x, buttonPos.y, SLIDER_DIM, SLIDER_DIM), "", "Slider Button")) {
					// If the button was clicked on, then update the position if there is a maximum height
					if (!Mathf.Approximately(maxHeight, 0.0)) {
						buttonPos = getButtonPos(Input.mousePosition, maxHeight, minHeight)[0]; 
						buttonHeight = getButtonPos(Input.mousePosition, maxHeight, minHeight)[1];
						showHeightLabel = true;
					} else if (Mathf.Approximately(maxHeight, 0.0)) {
						if (scenario && message != null) { // Only display a message if one is not already being displayed
							message = messageDisplayer.addMessage("Enter a maximum height and click on the save button");
						} else if (existing && message != null) {
							message = messageDisplayer.addMessage("Use the dropdown menus to select a Zoning Class and click on the save button");
						}
					}
				}				
				if (showHeightLabel) { // If the height label should be shown, then calculate what it should be and show it
					GUI.Label(Rect(buttonPos.x, buttonPos.y, SLIDER_DIM, SLIDER_DIM), "" + buttonHeight, "Height Label Text");
				}
			}
		}
				
		GUIUtility.RotateAroundPivot(-90, Vector2(TOP_LEFT.x + 30, TOP_LEFT.y + 352));
			GUI.Label(Rect(TOP_LEFT.x + 30, TOP_LEFT.y + 352, 200, 30), "SHOW LOTLINE", blackFontStyle);
		GUIUtility.RotateAroundPivot(90, Vector2(TOP_LEFT.x + 30, TOP_LEFT.y + 352));
		
		GUIUtility.RotateAroundPivot(90, Vector2(TOP_LEFT.x + 275, TOP_LEFT.y + 210));
			GUI.Label(Rect(TOP_LEFT.x + 275, TOP_LEFT.y + 205, 200, 30), "SHOW SETBACK", blackFontStyle);
		GUIUtility.RotateAroundPivot(-90, Vector2(TOP_LEFT.x + 275, TOP_LEFT.y + 210));
		
		GUI.Label(Rect(TOP_LEFT.x + 125, TOP_LEFT.y + 215, 100, 30), "FRONT", whiteFontStyle);
		GUI.Label(Rect(TOP_LEFT.x + 131, TOP_LEFT.y + 253, 100, 30), "REAR", whiteFontStyle);
		GUI.Label(Rect(TOP_LEFT.x + 134, TOP_LEFT.y + 291, 100, 30), "SIDE", whiteFontStyle);	
		GUI.Label(Rect(TOP_LEFT.x + 105, TOP_LEFT.y + 329, 200, 30), "FLANKAGE", whiteFontStyle);
		
		GUI.DrawTexture(Rect(TOP_LEFT.x + 60, TOP_LEFT.y + 205, 40, 160), buttonBackground);
			// The toggles which are on when the particular lotline should be shown. The number relates to the enumeration LineType
			// in SetbackLines.
			lotLineToggles[0] = GUI.Toggle(Rect(TOP_LEFT.x + 65, TOP_LEFT.y + 213, ON_OFF_DIM, ON_OFF_DIM), lotLineToggles[0], "");
			lotLineToggles[1] = GUI.Toggle(Rect(TOP_LEFT.x + 65, TOP_LEFT.y + 251, ON_OFF_DIM, ON_OFF_DIM), lotLineToggles[1], "");
			lotLineToggles[2] = GUI.Toggle(Rect(TOP_LEFT.x + 65, TOP_LEFT.y + 289, ON_OFF_DIM, ON_OFF_DIM), lotLineToggles[2], "");
			lotLineToggles[3] = GUI.Toggle(Rect(TOP_LEFT.x + 65, TOP_LEFT.y + 327, ON_OFF_DIM, ON_OFF_DIM), lotLineToggles[3], "");
			
		GUI.DrawTexture(Rect(TOP_LEFT.x + 210, TOP_LEFT.y + 205, 40, 160), buttonBackground);
			// The toggles which are on when the particular setback line should be shown. The number relates to the enumeration LineType
			// in SetbackLines, as above. 
			setbackToggles[0] = GUI.Toggle(Rect(TOP_LEFT.x + 215, TOP_LEFT.y + 213, ON_OFF_DIM, ON_OFF_DIM), setbackToggles[0], "");
			setbackToggles[1] = GUI.Toggle(Rect(TOP_LEFT.x + 215, TOP_LEFT.y + 251, ON_OFF_DIM, ON_OFF_DIM), setbackToggles[1], "");
			setbackToggles[2] = GUI.Toggle(Rect(TOP_LEFT.x + 215, TOP_LEFT.y + 289, ON_OFF_DIM, ON_OFF_DIM), setbackToggles[2], "");
			setbackToggles[3] = GUI.Toggle(Rect(TOP_LEFT.x + 215, TOP_LEFT.y + 327, ON_OFF_DIM, ON_OFF_DIM), setbackToggles[3], "");
	
	GUI.enabled = showGUI;
	
	if (scenario) { // If this parcel is an exception
		
		GUI.Label(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 52, 250, 20), "NAME CUSTOM ZONE", "Small White Font");
		currentStrings[0] = GUI.TextField(Rect(TOP_LEFT.x + 150, TOP_LEFT.y + 47, 140, 30), currentStrings[0]); // The zoning class
		
		GUI.Label(Rect(TOP_LEFT.x + 100, TOP_LEFT.y + 87, 200, 20), "DEFINE SETBACK DISTANCES", "Small White Font");
		GUI.DrawTexture(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 108, 285, 82), encBackground);
			// This section is dedicated to inputting the setback amounts as strings
			GUI.Label(Rect(TOP_LEFT.x + 1.5*SMALL_MARGIN, TOP_LEFT.y + 116, 100, 30), "FRONT", "Blue Font");
			GUI.Label(Rect(TOP_LEFT.x + 3*SMALL_MARGIN, TOP_LEFT.y + 152, 100, 30), "REAR", "Blue Font");
			currentStrings[1] = GUI.TextField(Rect(TOP_LEFT.x + 62, TOP_LEFT.y + 118, 65, 25), currentStrings[1], 4, "Setback Input");
			currentStrings[2] = GUI.TextField(Rect(TOP_LEFT.x + 62, TOP_LEFT.y + 153, 65, 25), currentStrings[2], 4, "Setback Input");
			GUI.Label(Rect(TOP_LEFT.x + 185, TOP_LEFT.y + 116, 100, 30), "SIDE", "Blue Font");
			GUI.Label(Rect(TOP_LEFT.x + 138, TOP_LEFT.y + 152, 150, 30), "FLANKAGE", "Blue Font");
			currentStrings[3] = GUI.TextField(Rect(TOP_LEFT.x + 221, TOP_LEFT.y + 118, 65, 25), currentStrings[3], 4, "Setback Input");
			currentStrings[4] = GUI.TextField(Rect(TOP_LEFT.x + 221, TOP_LEFT.y + 153, 65, 25), currentStrings[4], 4, "Setback Input");
		
		// Change the font to allow for a smaller label
		oldWhiteFontSize = whiteFontStyle.fontSize;
		whiteFontStyle.fontSize = 12;
		GUI.Label(Rect(TOP_LEFT.x + 288, TOP_LEFT.y + 270, 75, 15), "SET MAX HEIGHT", whiteFontStyle);
		GUI.Label(Rect(TOP_LEFT.x + 288, TOP_LEFT.y + 355, 75, 15), "SET MIN HEIGHT", whiteFontStyle);
		whiteFontStyle.fontSize = oldWhiteFontSize;
		
		// Strings for the maximum and minimum height
		currentStrings[5] = GUI.TextField(Rect(TOP_LEFT.x + 292, TOP_LEFT.y + 290, 60, 25), currentStrings[5], 4, "Blue Font");
		currentStrings[6] = GUI.TextField(Rect(TOP_LEFT.x + 292, TOP_LEFT.y + 325, 60, 25), currentStrings[6], 4, "Blue Font");
		
	} else { // This parcel is not an exception		
	
		GUI.enabled = !(zone1Menu || zone2Menu) && showGUI; // Only enable the encumberances textfield if the zone menus are not open
															// and the overall GUI is allowed to be enabled.
			GUI.Label(Rect(TOP_LEFT.x + 170, TOP_LEFT.y + 87, 200, 20), "ENCUMBERANCES", "Small White Font");
			currentStrings[7] = GUI.TextArea(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 108, 285, 82), currentStrings[7]); // Encumberances
		GUI.enabled = showGUI;
		
		// Change font size again
		oldWhiteFontSize = whiteFontStyle.fontSize;
		whiteFontStyle.fontSize = 15;
		GUI.Label(Rect(TOP_LEFT.x + 290, TOP_LEFT.y + 268, 75, 15), "MAX HEIGHT", whiteFontStyle);
		GUI.Label(Rect(TOP_LEFT.x + 290, TOP_LEFT.y + 355, 75, 15), "MIN HEIGHT", whiteFontStyle);
		whiteFontStyle.fontSize = oldWhiteFontSize;
		
		GUI.Label(Rect(TOP_LEFT.x + 292, TOP_LEFT.y + 290, 60, 25), maxHeight + "", "Blue Font");
		GUI.Label(Rect(TOP_LEFT.x + 292, TOP_LEFT.y + 325, 60, 25), minHeight + "", "Blue Font");
		
		// This section is dedicated to properly separating the zoning class into two parts - the prefix and suffix - and representing
		// that correctly in the menus. The dropdown menus are linked to each other through the zoneHandler helper functions.
		GUI.Label(Rect(TOP_LEFT.x + SMALL_MARGIN, TOP_LEFT.y + 52, 250, 20), "ZONING CLASS", "Small White Font");		
		GUI.DrawTexture(Rect(TOP_LEFT.x + 105, TOP_LEFT.y + 46, 75, 32), dropDownBox);
		GUI.Label(Rect(TOP_LEFT.x + 105, TOP_LEFT.y + 46, 75, 32), zone1Str, "Dropdown Text");
		GUI.DrawTexture(Rect(TOP_LEFT.x + 180, TOP_LEFT.y + 46, 112, 32), dropDownBox);
		GUI.Label(Rect(TOP_LEFT.x + 180, TOP_LEFT.y + 46, 112, 32), reduceLength(zone2Str), "Dropdown Text");
		if (GUI.Button(Rect(TOP_LEFT.x + 155, TOP_LEFT.y + 51, 20, 20), "", "Dropdown")) {
			zone2Str = "";
			zone1Menu = !zone1Menu;
		}
		if (GUI.Button(Rect(TOP_LEFT.x + 268, TOP_LEFT.y + 51, 20, 20), "", "Dropdown")) {
			if (!zone1Menu) {
				zone2Menu = !zone2Menu;
			}
		}		
		if (zone1Menu) zone1Handler();
		if (zone2Menu) zone2Handler();
	}
	
	// Save, hide, and close buttons	
	if(GUI.Button(Rect(TOP_LEFT.x + 198, TOP_LEFT.y + 375, 32, 32), "", "Save")) {
		saveContext();
	}			
	if(GUI.Button(Rect(TOP_LEFT.x + 10, TOP_LEFT.y + 375, 93, 32), "", "Hide")) {
		landuseUI.hide();
	}
	if(GUI.Button(Rect(TOP_LEFT.x + 104, TOP_LEFT.y + 375, 93, 32), "", "Close")) {
		landuseUI.closeProcedure();
	}
	
	GUI.enabled = prevGUI;
	
	GUI.Box(Rect(TOP_LEFT.x + 205, TOP_LEFT.y + 415, 150, 30), "PARCEL EDITOR");
		
	if(GUI.Button(Rect(TOP_LEFT.x + 25, TOP_LEFT.y + 420, 32, 32), "", "Tab")) {
		// If the tab button is clicked and the parcel editor is not on top, set move down to true (this will put it on top)
		if (!onTop) moveDown = true;
	}
	
	return Rect(TOP_LEFT.x, TOP_LEFT.y, FOLDER_DIM.x, FOLDER_DIM.y);
}

// This function sets the values of all toggle buttons in the script to false
public function setTogglesFalse() {
	for (var i : int = 0; i < 4; i++) {
		lotLineStates[i] = setbackStates[i] = lotLineToggles[i] = setbackToggles[i] = false;
	}
	showMassing = false;
}

// This function checks if the lines are labelled
public function checkLabelling() {
	return labelled;
}

// This function checks to see if there have been changes since the last save
public function changed() {
	if ((oldZoneStrs[0] != zone1Str) || (oldZoneStrs[1] != zone2Str)) changesMade = true;
	return changesMade;
}

// This function "puts" this editor on top, from the viewpoint of this script
public function setOnTop (b : boolean) {
	onTop = b;
}

// This is a helper function which parses the input strings used for the setbacks and height amounts.
private function parseInput (str : String) {
	var numbers : String = "0123456789";
	var oneDecimal : boolean = false; // Has a decimal already appeared?
	var newString : String = "";
	for (var s : char in str) {
		if (s == "." && !oneDecimal) { // Only add a period to newString if there has not already been one
			newString = newString + s;
			oneDecimal = true;
		} else if (numbers.Contains(s.ToString())) { // Add any numbers to newString
			newString = newString + s;
		}
	}
	if (newString == "") return 0.0; // Return 0 if the string is empty
	else return parseFloat(newString); // Otherwise, return newString parsed as a floating point number
}


// This version of getButtonPos is only for the Start() function - it takes in a mouse position and returns
// the corresponding button position for the slider
private function getButtonPos (mousePos : Vector3) {
	var bPos : Vector3;
	bPos = new Vector3(TOP_LEFT.x + 292, Screen.height - mousePos.y - SLIDER_DIM*0.5, 0);
	var topPos : float = TOP_LEFT.y + 20 - SLIDER_DIM*0.5;		// These were determined experimentally
	var bottomPos : float = TOP_LEFT.y + 250 - SLIDER_DIM*0.5;	//
	if (bPos.y < topPos) bPos.y = topPos;
	if (bPos.y > bottomPos) bPos.y = bottomPos;
	return bPos;
}

// This version of getButtonPos is used more often in drawFrame(). This takes in a mouse position, a maximum height,
// and a minimum height, and produces an array containing the position of the slider button and the height that this
// position corresponds to.	
private function getButtonPos (mousePos : Vector3, max : float, min : float) {
	var bPos : Vector3;
	var infoArray : Array = new Array(2);
	var height : float;
	bPos = new Vector3(TOP_LEFT.x + 292, Screen.height - mousePos.y - SLIDER_DIM*0.5, 0);
	var topPos : float = TOP_LEFT.y + 20 - SLIDER_DIM*0.5;		// Experimental numbers, and noted above
	var bottomPos : float = TOP_LEFT.y + 250 - SLIDER_DIM*0.5;
	if (bPos.y < topPos) bPos.y = topPos;
	if (bPos.y > bottomPos) bPos.y = bottomPos;
	height = Mathf.Round(max + (max - min)*(topPos - bPos.y)/(bottomPos - topPos)); // Uses linear interpolation to find this out.
																					// Use y = mx + b, with height as y and bPos.y
																					// as x, and this formula will make sense.
	infoArray[0] = bPos;
	infoArray[1] = height;
	return infoArray;
}

// This is a function which either shows the lotline of the specified type, or sends the user to label the lotlines if they
// are not labelled.
private function proceedToShowLotLine (lt : LineType) {
	if (sInfo != null && labelled == true) {
		setbacks.showLLofType(lt, sInfo.RefArray, sInfo.DistArray);
		return;
	} else {
		landuseUI.closeAndOpenUI(UI.LineLabelling);
	}
}

// This function either shows the setback of the specified type, or sends the user to label the lotlines if they are not labelled.
private function proceedToShowSetback (lt : LineType) {
	if (sInfo != null && labelled == true) {
		setbacks.showSetbackOfType(lt, sInfo.RefArray, sInfo.DistArray);
		return;
	} else {
		landuseUI.closeAndOpenUI(UI.LineLabelling);
	}
}

// This function is a dummy function used so that MessageDisplay calls it when it uses GameObject.SendMessage()
private function saveContextParcel() {
	saveContext();
}

// This function is called by the LineLabellingUI script. It indicates that the user has finished labelling a parcel which they have
// denoted as a non-exception
public function doneLabellingNormal (refArray : int[], distArray : float[], maxh : float, minh : float) {
	if (sInfo == null) sInfo = new SetbackInfo();
	sInfo.ZoningClass = combineZones(zone1Str, zone2Str);
	sInfo.RefArray = refArray;
	sInfo.DistArray = distArray;
	maxHeight = sInfo.MaxHeight = maxh;
	minHeight = sInfo.MinHeight = minh;
	sInfo.IsException = false;
	forceExisting();
	labelled = true;
	Debug.Log(sInfo.encodeToJSON());
	// Write to the database here. All the code above should be straightforward.
	yield backend.sendRequest(["update", parcel.gameObject.name, "SetbackInfo", sInfo.encodeToJSON()]);
	if (backend.getResult() == null) {
		messageDisplayer.addMessage("Sorry, we were unable to save the setback information to the database");
	}
}

// This function is called by the LineLabellingUI script also. It indicates that the user has finished labelling a parcel which they 
// have denoted as an exception.
public function doneLabellingException (refArray : int[]) {
	if (sInfo == null) sInfo = new SetbackInfo();
	sInfo.RefArray = refArray;
	sInfo.IsException = true;
	labelled = true;
}

// Also called by LineLabellingUI. Forces the user to input setback and height amounts.
public function forceAmounts () {
	userGivingAmounts = true;
	scenarioAllowed = true;
	existingAllowed = false;
}

// Called by LineLabellingUI. Forces the parcel to become a non-exception parcel.
public function forceExisting () {
	userGivingAmounts = false;
	existingAllowed = true;
	scenarioAllowed = false;
}

// This function finds the setback amount that a certain line type lt has, given a reference array refArray and
// an array of setback distances distArray
private function findAmount (refArray : int[], distArray : float[], lt : LineType) {
	for (var i : int = 0; i < refArray.length; i++) {
		if (refArray[i] == lt) return distArray[i];
	}
	return 0.0;
}

// This function resets all the values of old strings to the value of current strings.
private function resetStrings() {
	for (var i : int = 0; i < NUM_INPUT_STRINGS; i++) {
		oldStrings[i] = currentStrings[i];
	}
	oldZoneStrs[0] = zone1Str;
	oldZoneStrs[1] = zone2Str;
}	

// This function controls the zone prefix menu. It functions as a typical drop-down menu
private function zone1Handler() {
	GUILayout.BeginArea(Rect(TOP_LEFT.x + 105, TOP_LEFT.y + 78, 75, 4*32));
		GUILayout.BeginVertical();
			for (var i : int = 0; i < 4; i++) {
				if (GUILayout.Button(ZONING_PREFIX[i], "Dropdown Selection")) {
					zone1Str = ZONING_PREFIX[i];
					zone1Menu = false;
					zone2Menu = true;
				}
			}
		GUILayout.EndVertical();
	GUILayout.EndArea();	
}

// This function controls the zone suffix menu. It also function as a typical drop-down menu. However, the first
// part of this function is determining which zone suffix array to use as the content for this drop-down menu.
private function zone2Handler() {
	if (zone1Str == "") {
		zone2Menu = false;
		zone2Str = "";
	} else if (zone1Str == "C") {
		if (zone2Choices.length != ZONE_END_C.length) {
			zone2Choices.Clear();
			for (var i : int = 0; i < ZONE_END_C.length; i++) {
				zone2Choices.Push(ZONE_END_C[i]);
			}
		}
	} else if (zone1Str == "G") {
		if (zone2Choices.length != ZONE_END_G.length) {
			zone2Choices.Clear();
			for (i = 0; i < ZONE_END_G.length; i++) {
				zone2Choices.Push(ZONE_END_G[i]);
			}
		}
	} else {
		if (zone2Choices.length != ZONE_END_MR.length) {
			zone2Choices.Clear();
			for (i = 0; i < ZONE_END_MR.length; i++) {
				zone2Choices.Push(ZONE_END_MR[i]);
			}
		}
	}
	GUILayout.BeginArea(Rect(TOP_LEFT.x + 180, TOP_LEFT.y + 78, 112, zone2Choices.length*32));
		GUILayout.BeginVertical();
			for (i = 0; i < zone2Choices.length; i++) {
				if (GUILayout.Button((zone2Choices[i] as String), "Dropdown Selection")) {
					zone2Str = zone2Choices[i];
					zone2Menu = false;
				}
			}
		GUILayout.EndVertical();
	GUILayout.EndArea();
}

// This function reduces a long string to one that has an ellipsis after its ninth character
private function reduceLength(str : String) {
	if (str.length > 11) {
		str = str.Substring(0, 9) + "...";
	}
	return str;
}

// This function combines the zone prefix, s1, and the zone suffix, s2, into a zoning class
// that is consistent with those in the CSV file
private function combineZones(s1 : String, s2 : String) {
	if (s1 == "" || (s1 != "G" && s2 == "")) return "";
	if (s2 == "Triplex" || s2 == "Lodging House") {
		s2 = "Triplex/Lodging House";
	}
	return s1 + s2;
}

// This function separates a zone class into its prefix and suffix as an array
private function undoZones (zoneClass : String) {
	var strArray : String[] = new String[2];
	if (zoneClass == "") return ["", ""];
	if (zoneClass.StartsWith("C")) {
		return ["C", zoneClass.Substring(1)];
	} else if (zoneClass.StartsWith("G")) {
		if (zoneClass.length == 1) {
			return ["G", ""];
		} else {
			return ["G", zoneClass.Substring(1)];
		}
	} else if (zoneClass.Contains("/")) {
		return [zoneClass.Substring(0, 6), zoneClass.Substring(6, 7)];
	} else {
		return [zoneClass.Substring(0, 6), zoneClass.Substring(6)];
	}
}

///////////////////// THE FOLLOWING ARE ALL SLIGHTLY DIFFERENT CASES OF NEW CONTEXT. ////////////////////////////
////////////////// THE HELPER FUNCITONS REDUCE THE LENGTH OF THE NEW CONTEXT FUNCTION.  /////////////////////////

private function newContextNullParcel() { // New context when the parcel is null
	sInfo = null;
	massing = null;
	setbacks = null;
	newContextEmpty();
}

private function newContextEmpty() { // New context for an empty set of data
	for (str in currentStrings) str = "";
	zone1Str = zone2Str = "";
	sInfo = null;
	labelled = false;
	maxHeight = minHeight = 0.0;
}	

private function newContextWithInfo(info : SetbackInfo) { // New context when there is valid setback info data
	scenarioAllowed = info.IsException;
	existingAllowed = !scenarioAllowed;
	setbacks.useEncodedRefs(info.RefArray, info.DistArray);
	for (var i : int = 0; i < 4; i++) {
		currentStrings[i+1] = findAmount(info.RefArray, info.DistArray, i) + "";
	}
	maxHeight = info.MaxHeight;
	if (Mathf.Approximately(maxHeight, 0.0)) maxHeight = 36.0;
	minHeight = info.MinHeight;
	currentStrings[5] = info.MaxHeight + "";
	currentStrings[6] = info.MinHeight + "";
	labelled = true;
}

private function newContextNoRefs() { // New context when there are no references in the setback info data
	for (var i : int = 0; i < 4; i++) {
		currentStrings[i+1] = "";
	}
	currentStrings[5] = "";
	currentStrings[6] = "";
	labelled = false;
	maxHeight = minHeight = 0.0;
}	

private function overallNewContextFromInfo(info : SetbackInfo) { // New context that is called whenever setback data is not null
	if (info.ZoningClass != null) {
		currentStrings[0] = info.ZoningClass;
		zone1Str = undoZones(currentStrings[0])[0];
		zone2Str = undoZones(currentStrings[0])[1];
	} else {
		currentStrings[0] = "";
		zone1Str = zone2Str = "";
	}
	if (info.Encumberances != null) {
		currentStrings[7] = info.Encumberances;
	} else {
		currentStrings[7] = "";
	}
}