// Main Pie Menu - For the main pie menu which is the first level of user interactivity (attached to the menusphere)
// This relies heavily on PieMenu.cs and PieMenuManager.cs, which are both in the standard assets folder.

#pragma strict

private var uiAccessor : UIControl; // UIControl, we all hail
uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);

private var messageDisplay : MessageDisplay;
messageDisplay = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);

public var webMode : boolean = true;	// remember to set it to true on the Sphere object before building (Web Player build) !

function OnSelect(command) { // Function used for SendMessage in PieMenu. This is a basic application of the pie menu functionality.
	if (command == "Wiki") {
		uiAccessor.openUI(UI.LandUse);
	}
	if (command == "Screenshot") { 
		uiAccessor.openUI(UI.Screenshot);
	}
	if (command == "Parcel") {
		uiAccessor.openUI(UI.BuildingReplace);
	}
	
	if (command == "ImportObj") {
		if (!webMode) {
		/* use this if testing obj import on Unity Editor OR building desktop build */
			uiAccessor.openUI(UI.FileBrowser);
		} else {
		/* use this if doing obj import on web player build */
			messageDisplay.addMessage("Click on the button below the Unity Web Player to import a model!\n"+
								"(Please pick the .obj file along with the .mtl file and all the texture files if nessecary.");
			GameObject.Find(ImportObject.SCRIPT_HOST).GetComponent(ImportObject).newObj();
		}
	}
	
	/*
	if (command == "cmd0_1") {
    	uiAccessor.openUI(UI.SidewalkModification);
	}
	*/
	
    if (command == "StreetFurniture") {
    	uiAccessor.openUI(UI.StreetFurniture);
    }
    if (command == "HelpMenu"){
    	GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(HelpMenu).enabled = true;
    }
    if (command == "RightOfWay"){
    	uiAccessor.openUI(UI.RightOfWay);
    }
    
    if (command == "EditObjects"){
    	uiAccessor.openUI(UI.EditObjects);
    }
    
}

function mouseOnButton (command) {
	//Debug.Log("mouseOnButton");
	/*if (command == "Wiki") {
		Debug.Log("Land Use Editor");
	}
	if (command == "Screenshot") { 
		Debug.Log("Screenshot");
	}
	if (command == "Parcel") {
		
	}
	if (command == "ImportObj") {
		Debug.Log("Object Import");
	}
    if (command == "StreetFurniture") {
    	Debug.Log("Land Use Editor");
    }
    if (command == "HelpMenu"){
    	Debug.Log("Help Menu");
    }
    if (command == "RightOfWay"){
    	Debug.Log("Right of Way Editor");
    }  
    if (command == "EditObjects"){
    	Debug.Log("Object Editor");
    }*/
	CursorLock.SetMouseOnGUI();
}