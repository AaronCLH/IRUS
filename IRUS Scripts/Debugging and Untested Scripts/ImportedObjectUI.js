/*
#pragma strict

private var uiAccessor : UIControl;
private var accessLibrary : ObjectLibrary;
private var messageDisplayer : MessageDisplay;
private var scrollPositionType : Vector2;
private var scrollLength : int;
private var scrollStrings : String[];
private var selectedTypeInd : int = 0;
private var objNameInput : String = "Object Name";
private var pbm : ParcelBuildingManager;

function Start () {
	uiAccessor = gameObject.GetComponent(UIControl);
	accessLibrary = GameObject.Find(ObjectLibrary.SCRIPT_HOST).GetComponent(ObjectLibrary);
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	pbm = GameObject.Find(ParcelBuildingManager.SCRIPT_HOST).GetComponent(ParcelBuildingManager);
	if ("Imported Furniture" in ObjectLibrary.TypeNames) {
		if ("Large Object" in ObjectLibrary.TypeNames) {
			scrollLength = accessLibrary.getNumTypes();
		} else {
			scrollLength = accessLibrary.getNumTypes() + 1;
		}
	} else if ("Large Object" in ObjectLibrary.TypeNames) {
		scrollLength = accessLibrary.getNumTypes() + 1;
	} else {
		scrollLength = accessLibrary.getNumTypes() + 2;
	}
	scrollStrings = new String[scrollLength];
	accessLibrary.resizeTypeNames();
	System.Array.Copy(ObjectLibrary.TypeNames, scrollStrings, scrollLength - 2);
	scrollStrings[scrollLength - 2] = "Other Street Furniture";	
	scrollStrings[scrollLength - 1] = "Building";
}

function OnGUI() {
	GUILayout.BeginArea(Rect(Screen.width/3, Screen.height/3, Screen.width/3, Screen.height/3));
		GUILayout.BeginVertical();
			GUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				GUILayout.Button("What type of object is this?");
				GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
				scrollPositionType = GUILayout.BeginScrollView(scrollPositionType, GUILayout.Width(Screen.width/3));
				selectedTypeInd = GUILayout.Toolbar(selectedTypeInd, scrollStrings);
				GUILayout.EndScrollView();
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
				GUILayout.Box("Set Object Name: ", GUILayout.Width(Screen.width/8));
				objNameInput = GUILayout.TextField(objNameInput, 30);
			GUILayout.EndHorizontal();
			GUILayout.BeginHorizontal();
				if(GUILayout.Button("Quit to Main")) {
					Destroy(ImportObject.NewObject);
					uiAccessor.closeUI(UI.ImportWindow);
				} else if (GUILayout.Button("Save Changes")) {
					ImportObject.NewObject.name = objNameInput;
					if (selectedTypeInd < scrollLength - 2) {
						ImportObject.NewObject.tag = scrollStrings[selectedTypeInd];
						loadFurnitureToLibrary(ImportObject.NewObject);				
					} else if (scrollStrings[selectedTypeInd] == "Other Street Furniture") {
						ImportObject.NewObject.tag = "Imported Furniture";
						loadFurnitureToLibrary(ImportObject.NewObject);
					} else {
						ImportObject.NewObject.tag = "Building";
						pbm.addBuildingModel(ImportObject.NewObject);
						messageDisplayer.addMessage("Your imported object has been added to the your building library.");
						uiAccessor.closeUI(UI.ImportedObject);
					}
				}
			GUILayout.EndHorizontal();
		GUILayout.EndVertical();
	GUILayout.EndArea();			
}

private function loadFurnitureToLibrary(obj : GameObject) {
	accessLibrary.loadGOToList(obj);
	messageDisplayer.addMessage("Your imported object has been added to the Street Furniture Menu.");
	uiAccessor.closeUI(UI.ImportedObject);
}				
*/