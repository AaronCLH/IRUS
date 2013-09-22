/*------------------------------------------------------------------------------------------------------------------*/
// UIControl Script
//
// This script handles the opening and closing of every User Interface contained within the project. Often, other scripts
// have a variable called uiAccessor of type UIControl, which is a reference to the instance of this script attached to the 
// GameObject UI Handler, and allows those scripts to freely and easily open and close UIs. Using enumerations in this case
// offers clarity and simplicity throughout the scripts which reference UIControl.
//
// The procedure for adding a new UI is simple:
// 1. Add another element to the UI enumeration
// 2. Increase the constant NUM_UI_STATES by 1
// 3. Add another element to the introMessage array
// 4. Add another String to the UI_NAMES array. This string should be < name of UI > if the script name is "< name of UI >UI".
//    This string can handle spaces, even though the script name cannot. (Consider "Street Furniture" as the string but 
//    "StreetFurnitureUI" is the script name)
// 5. Update the UI_TABLE in the Awake() function, if necessary. This is only needed if you need the ability to have other 
//    UIs open at the same time that your new UI is open.
//
/*-----------------------------------------------------------------------------------------------------------------*/


#pragma strict

public enum UI {
	/* 0 */		Screenshot,
	/* 1 */		StreetFurniture,
	/* 2 */		FileBrowser,	// if this is moved (to another position in enum UI), remember to update FileBrowserUI.cs and FileBrowser.cs
	/* 3 */		ImportWindow,
	/* 4 */		BuildingReplace,
	/* 5 */		Rotation,
	/* 6 */		Movement,
	/* 7 */		LandUse,
	/* 8 */		LineLabelling,
	/* 9 */		Scaling,
	/* 10 */    RightOfWay,
	/* 11 */    EditObjects,
	/* 12 */    EditBuilding

}

static var SCRIPT_HOST : String = "UI Handler"; // The name of the GameObject holding this script. 

private var NUM_UI_STATES : int = 13;														// The number of UIs currently
private var UI_TABLE = MultiDim.BooleanArray(NUM_UI_STATES,NUM_UI_STATES);					// The table specifying which UIs can be open
																							// at the same time
private var activeUIs : boolean[] = new boolean[NUM_UI_STATES];								// A table denoting the UIs that are currently open
private var UI_NAMES : String[] = new String[NUM_UI_STATES];								// The name of each UI
UI_NAMES = ["Screenshot","Street Furniture", "File Browser", "Import Window",
			"Building Replace", "Rotation",
			"Movement", "Land Use", "Line Labelling", "Scaling", "RightOfWay", "EditObjects", "EditBuilding"];	// must match script name (with optionally any number of spaces) and suffix "UI" removed
	
private var messageDisplayer : MessageDisplay;												// Reference to be able to show messages

private var introMessage : String[] = [														// Message displayed upon opening the UI
	/* 0 */		"",//"Take a screenshot using the menu",
	/* 1 */		"",//"Place multiple street furniture on the sidewalk all at once",
	/* 2 */		"",//"Select a .obj file from the file browser to import",
	/* 3 */		"Classify your imported object",
	/* 4 */		"",
	/* 5 */		"Click on the dial to rotate your object, or enter a value",
	/* 6 */		"Use the on-screen arrows to move your object",
	/* 7 */		"Click on a building to view its info",
	/* 8 */	    "Click on the floating icons to label the lotlines",
	/* 9 */     "Enter new values to change the real world dimension",
	/* 10 */    "", //replace by the instruction box: see RightOfWayUI.js
	/* 11 */    "Select an object along the Streetscape",
	/* 12 */    "Select a tool to edit the building"
	
];

function Awake () {
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	
	// Sets all values in the UI_TABLE to false initially. This prevents multiple UIs from being opened at once
	// except for those noted at the end of this block of code.
	for (var i : int = 0; i < NUM_UI_STATES; i++) {
		for (var j : int = 0; j < NUM_UI_STATES; j++) {
			UI_TABLE[i,j] = false;
		}
	}
	// Allow the edit objects to be open with one of rotation, movement or scaling uis
	UI_TABLE[UI.EditObjects, UI.Rotation] = true;
	UI_TABLE[UI.EditObjects, UI.Movement] = true;
	UI_TABLE[UI.EditObjects, UI.Scaling] = true;
	UI_TABLE[UI.Rotation, UI.EditObjects] = true;
	UI_TABLE[UI.Movement, UI.EditObjects] = true;
	UI_TABLE[UI.Scaling, UI.EditObjects] = true;

   // Allow the edit building to be open with one of rotation, movement or scaling uis	
	UI_TABLE[UI.EditBuilding, UI.Rotation] = true;
	UI_TABLE[UI.EditBuilding, UI.Movement] = true;
	UI_TABLE[UI.EditBuilding, UI.Scaling] = true;
	UI_TABLE[UI.Rotation, UI.EditBuilding] = true;
	UI_TABLE[UI.Movement, UI.EditBuilding] = true;
	UI_TABLE[UI.Scaling, UI.EditBuilding] = true;

	// Allow the street furniture UI to be open with one of rotation, movement or scaling uis	
	UI_TABLE[UI.StreetFurniture, UI.Rotation] = true;
	UI_TABLE[UI.StreetFurniture, UI.Movement] = true;
	UI_TABLE[UI.StreetFurniture, UI.Scaling] = true;
	UI_TABLE[UI.Rotation, UI.StreetFurniture] = true;
	UI_TABLE[UI.Movement, UI.StreetFurniture] = true;
	UI_TABLE[UI.Scaling, UI.StreetFurniture] = true;
	
	for (var bool : boolean in activeUIs) { // Initially sets all UIs to inactive 
		bool = false;
	}
}

// This function takes in a UI (like UI.Movement) and opens it, if it is allowed to be opened
public function openUI (ui : UI) {
	Debug.Log("UIControl log : Open " + ui);
	
	var ind : int = 0;
	for (var bool : boolean in activeUIs) { // Loops over all UIs to check which are open 
		if (bool == true) { 
			if (ui == ind) { // If a UI is opened and equal to the input ui, display a message and exit the function
				messageDisplayer.addMessage(UI_NAMES[ui] + " Menu is already open!");
				return;
			} else if (UI_TABLE[ui, ind] == false) { // If a UI is already open and not allowed to be open when the input ui is
													 // open, display a message and exit the function
				messageDisplayer.addMessage("Cannot display " + UI_NAMES[ui] + " Menu while "
				 + UI_NAMES[ind] + " Menu is open.");
				 return;
			}
		}
		ind++; // Increment the counter
	}
	if (introMessage[ui] != "") messageDisplayer.addMessage(introMessage[ui],	gameObject,       // If the intro message is not the null String,
															["Dismiss",	"Don't show next time"],  // display it and give the user the option to
															["",		"dontShowIntro"],		  // have it not displayed next time.
															[void,		ui]);					  //
	activeUIs[ui] = true; // Note that the inputted ui is now open
	(gameObject.GetComponent(getScriptName(UI_NAMES[ui])) as MonoBehaviour).enabled = true;
}

// This function closes the inputted UI ui.
public function closeUI (ui : UI) {
	Debug.Log("UIControl log : Close " + ui);
	activeUIs[ui] = false;
	(gameObject.GetComponent(getScriptName(UI_NAMES[ui])) as MonoBehaviour).enabled = false;
}

// This function checks if the inputted UI ui is open.
public function checkUIState(ui : UI) {
	return activeUIs[ui];
}

// This function returns the script name of the corresponding UI name. getScriptName("Land Use") returns "LandUseUI"
private function getScriptName (str : String) {
	return str.Replace(" ","") + "UI";
}

// This function mutates the introMessage corresponding to ui into the null string
public function dontShowIntro (ui : UI) {
	introMessage[ui] = "";
}

// This function closes a UI and then opens another UI
public function closeAndOpen(from: UI, to: UI){
	if (checkUIState(from)){
		closeUI(from);
	}
	openUI(to);
}