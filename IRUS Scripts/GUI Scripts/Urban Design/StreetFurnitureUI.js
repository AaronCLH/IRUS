/*----------------------------------------------------------------------------------------------------------*/
// Street Furniture UI Script
//
// This script is responsible for the current Urban Design Menu. It accesses the 
// ObjectLibrary script to be able to reference the prefabs inside of the Resources folder in the Project menu.
// It also accesses UIControl so that it is able to close itself, and accesses the PreviewManager script to 
// handle the display of the prefab objects as a preview, before instantiating the actual object.
//
// FIles used: 

// typeObj.js 
//  - typeObj.getSpecies(selectedSpeciesInd).getPrefab()  - typeObj.removeEmptyNames(); // Resizes the species array to remove null species
//  - typeObj.getSpeciesNames()  // Produces an array of strings specifying the species names

/*----------------------------------------------------------------------------------------------------------*/

#pragma strict

// Variables to access instances of other scripts
private var previewHandler : PreviewManager;
private var uiAccessor : UIControl;
private var accessLibrary : ObjectLibrary;

static var streetFurnitureOn : Boolean;

private var previewMode : Boolean = false;

private var scrollPositionType : Vector2;		// scrolling for Type toolbar
private var scrollPositionSpecies : Vector2;	// scrolling for Species selectiongrid
private var selectedTypeInd : int = 0;			// index of selected Type in TypeList
private var previousSelectedTypeInd : int = -1;	// used to check if selection for Type is changed
private var selectedSpeciesInd : int = 0;		// index of selected Species in the speciesList of the selected Type
//public var guiBackground : GUITexture;          // background texture
private var removeMargin : GUIStyle;            // GUIStyle that removes margins in certain instances
private var MAX_OBJS : int = 12;                // Maximum number of objects that can be instantiated on a sidewalk
private var tempString : String;

//RUth
public var skin : GUISkin;

public var dottedLine : Texture2D;
private var title_pivot : Vector2;

private var changeListOfSidewalks : String[];		// To register the unity name of sidewalks that are being changed
private var sidewalkChangeListPointer : int = 0;
public var undoButtonActive : Boolean = false;		// True if the undo button is active
public var restoreDefaultActive : Boolean = false;	// True if the restore default button is active

private var editUIEnabled : Boolean = false;
private var editButtonWidth : float = 50;
private var editButtonHeight : float = 35;
static var selectedTool : SelectedTool;
static var objArray : Array;
static var lastSelectedObj : GameObject;
static var lastSelectedObjName : String;
private var registerToDeleteGroups : Array;

function Awake () {	
	previewHandler = GameObject.Find(PreviewManager.SCRIPT_HOST).GetComponent(PreviewManager);
	uiAccessor = gameObject.GetComponent(UIControl);
	accessLibrary = GameObject.Find(ObjectLibrary.SCRIPT_HOST).GetComponent(ObjectLibrary);
	tempString = "2";
	changeListOfSidewalks = new String[10];
	undoButtonActive = false;
	restoreDefaultActive = false;
	editUIEnabled = false;
	selectedTool = SelectedTool.None;
	objArray = new Array();
	registerToDeleteGroups = new Array();
}

function OnEnable () {
	Group.AllowSpawn = true; // Allows the objects to be spawned on the sidewalk when this script is enabled
	streetFurnitureOn = true;
}

function OnDisable () {
	Group.AllowSpawn = false; // Does not allow objects to be spawned on the sidewalk when this script is disabled
	streetFurnitureOn = false;
	previewMode = false;
	undoButtonActive = false;
	restoreDefaultActive = false;
	editUIEnabled = false;
}

function Update () {
	if(objArray.length > 0) {
		if(!editUIEnabled) previewMode = true;
		editUIEnabled = true;
		undoButtonActive = false;
		restoreDefaultActive = false;
	} else {
		if(editUIEnabled) previewMode = false;
		CloseCurrentTool();
		editUIEnabled = false;
	}
	if(registerToDeleteGroups.length > 0) {
		RegisterDeletedObjects();
	}
}

function OnGUI() {
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	
	if (Rect(15, 15, 400, 560).Contains(
		Vector2(Input.mousePosition.x, Screen.height-Input.mousePosition.y))) {
		CursorLock.SetMouseOnGUI(); // Notifies the Cursor function that the mouse is on a GUI Element if the cursor position is on GUI
	}

	/*if (Rect(15, 15, 400, 560).Contains(Vector2(Input.mousePosition.x, Screen.height-Input.mousePosition.y))) {
		Debug.Log("StreetFurnitureUI log : mouse in StreetFurnitureUI");
	}*/

	GUI.BeginGroup(Rect(15,15,400,560));
		GUI.BeginGroup(Rect(5,0,350,50),"","OrangeFolderTop");
			if(previewMode) {
				if(GUI.Button(Rect(265,10,30,30),"","Checkmark")) {
					previewMode = false;
				}
			} else {
				if(GUI.Button(Rect(265,10,30,30),"","Minimize")) {
					previewMode = true;
					undoButtonActive = false;
					restoreDefaultActive = false;
				}
			}
			if(GUI.Button(Rect(305,10,30,30),"","Close")) {
				if(editUIEnabled) {
					DeselectGhostedObjs();
					objArray.Clear();
					Debug.Log("StreetFurnitureUI log : objArray.length = " + objArray.length);
				}
				editUIEnabled = false;
				if(sidewalkChangeListPointer != 0) {
					Debug.Log("StreetFurnitureUI log : Changes made not saved yet");
					for(var i = 0; i < sidewalkChangeListPointer; i++) {
						var unityNameInfo : String[] = changeListOfSidewalks[i].Split("~"[0]);
						var sidewalkObj : GameObject = GameObject.Find("Road Segments/" + unityNameInfo[0] + "/" + unityNameInfo[1]);
						for(var child : Transform in sidewalkObj.transform/* as Transform[]*/) {
							UnityEngine.Object.Destroy(child.gameObject);
						}
						var lastChange : String = GameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveLastUrbanDesignChange(changeListOfSidewalks[i]);
						if(lastChange != null || lastChange != "") {
							if(!sidewalkObj.GetComponent(Group).PopulateUserObjects(lastChange)) {
								GameObject.Find("DataHandler").GetComponent(UserDataBackend).RestoreDefaultUrbanDesignObjects(changeListOfSidewalks[i],sidewalkObj,sidewalkObj.GetComponent(Group).ReturnWardNumber());
							}
						}
						sidewalkObj.GetComponent(Group).ChangesUnmade();
					}
					sidewalkChangeListPointer = 0;
					changeListOfSidewalks = null;
					changeListOfSidewalks = new String[10];
				}
				previewHandler.disablePreview();
				CloseCurrentTool();
				uiAccessor.closeUI(UI.StreetFurniture);
			}
		GUI.EndGroup();
		var typeObj : Type = ObjectLibrary.TypeList[selectedTypeInd]; //ruth
		if(!previewMode) {
			GUI.BeginGroup(Rect(360,50,40,155),"","OrangeFolderSide");
					if(GUI.Button(Rect(5,35,30,115),"","TitleButton_Furniture")) {
						selectedTypeInd = 0;
					}
			GUI.EndGroup();
			GUI.BeginGroup(Rect(360,205,40,155),"","OrangeFolderSide");
					if(GUI.Button(Rect(5,35,30,115),"","TitleButton_Vegetation")) {
						selectedTypeInd = 1;
					}
			GUI.EndGroup();
			GUI.BeginGroup(Rect(0,50,360,510),"","OrangeFolderBottom");
				previewHandler.enablePreview();
				accessLibrary.resizeTypeNames();
				if (Event.current.type == EventType.Repaint) { // EventType.Repaint is the second time through OnGUI
					previewHandler.showPreviewObject(Rect(45,105,300,175), typeObj.getSpecies(selectedSpeciesInd).getPrefab());
				}
				GUI.BeginGroup(Rect(30,235,300,125));
					var scrollViewHeight : int = Math.Round(typeObj.getNumSpecies()/2) * 45;
					scrollPositionSpecies = GUI.BeginScrollView(Rect(-10,0,310,130),scrollPositionSpecies, Rect(0,0,280,scrollViewHeight + 20)); // For Species
						if (previousSelectedTypeInd != selectedTypeInd) selectedSpeciesInd = 0; // If the type being shown has changed since the last frame, sets the species index for the preview to 0.
						typeObj.removeEmptyNames(); // Resizes the species array to remove null species
						selectedSpeciesInd = GUI.SelectionGrid(Rect(15,0,270,scrollViewHeight), selectedSpeciesInd, typeObj.getSpeciesNames(), 2); // Gets the user to select a species from the selected type.
						if (selectedSpeciesInd < 0) selectedSpeciesInd = previousSelectedTypeInd;
					GUI.EndScrollView();
				GUI.EndGroup();

				tempString = GUI.TextField(Rect(220,380,35,25),tempString);
				var tempNumber : int;
				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp)) {
					if(int.TryParse(tempString,tempNumber)) {
						if(tempNumber <= MAX_OBJS && tempNumber >=1) {
							Group.NumObjects = tempNumber;
						} else {
							tempString = Group.NumObjects.ToString();
						}
					} else {
						tempString = Group.NumObjects.ToString();
					}
				}
				GUI.Label(Rect(30,380,190,40),"Objects on sidewalk : " + Group.NumObjects + "  <--");
				if(undoButtonActive) {
					if(GUI.Button(Rect(20,445,100,50),"Undo","FunctionButtonGreen")) {
						undoButtonActive = false;
					}
				} else {
					if(GUI.Button(Rect(20,445,100,50),"Undo","FunctionButton")) {
						undoButtonActive = true;
						restoreDefaultActive = false;
					}
				}
				if(restoreDefaultActive) {
					if(GUI.Button(Rect(130,445,100,50),"Restore\nDefault","FunctionButtonGreen")) {
						restoreDefaultActive = false;
					}
				} else {
					if(GUI.Button(Rect(130,445,100,50),"Restore\nDefault","FunctionButton")) {
						restoreDefaultActive = true;
						undoButtonActive = false;
					}
				}
				var saveChangesButton : Boolean = (sidewalkChangeListPointer == 0) ? GUI.Button(Rect(240,445,100,50),"Save\nChanges","FunctionButton") : GUI.Button(Rect(240,445,100,50),"Save\nChanges","FunctionButtonActiveSaves");
				//if(sidewalkChangeListPointer != 0) Debug.Log("StreetFurnitureUI log : Changes made");
				if(saveChangesButton) {
					Debug.Log("StreetFurnitureUI log : Save Changes");
					undoButtonActive = false;
					restoreDefaultActive = false;
					for(i = 0; i < sidewalkChangeListPointer; i++) {
						gameObject.Find("DataHandler").GetComponent(UserDataBackend).AddUrbanDesignObjectChanges(changeListOfSidewalks[i]);
						var sidewalkPath : String[] = changeListOfSidewalks[i].Split("~"[0]);
						var sidewalkObjGroup : Group = GameObject.Find("Road Segments/" + sidewalkPath[0] +"/" + sidewalkPath[1]).GetComponent(Group);
						sidewalkObjGroup.changesMade = false;
						sidewalkObjGroup.UpdateUnredoList();
						if(sidewalkPath[1] == "SidewalkLeft") GameObject.Find("Road Segments/" + sidewalkPath[0]).GetComponent(InstantiateRoadElements).containUserDataSidewalkLeft = true;
						else if(sidewalkPath[1] == "SidewalkRight") GameObject.Find("Road Segments/" + sidewalkPath[0]).GetComponent(InstantiateRoadElements).containUserDataSidewalkRight = true;
					}
					sidewalkChangeListPointer = 0;
					changeListOfSidewalks = null;
					changeListOfSidewalks = new String[10];
				}
			GUI.EndGroup();
		} else {
			if(editUIEnabled) {
				typeObj = ObjectLibrary.TypeList[ObjectLibrary.ReturnTypeIndex(lastSelectedObj.tag)];
				if (Event.current.type == EventType.Repaint) { // EventType.Repaint is the second time through OnGUI
					previewHandler.showPreviewObject(Rect(45,105,300,175), typeObj.getSpeciesPrefabByName(lastSelectedObjName));
				}
				GUI.Label(Rect(30,265,200,30),GUIContent(lastSelectedObjName,"Selected Type"),"PreviewBox");
				GUI.Label(Rect(30 + 250,265,50,30),GUIContent(objArray.length.ToString(),"Number of Selections"),"PreviewBox");
				if(GUI.Button(Rect(330,235,30,30),GUIContent("","Select\nAll Type"),"SelectAllType")) {
					Debug.Log("StreetFurnitureUI log : Select all " + lastSelectedObjName + " from sidewalk");
					for(var child : Transform in lastSelectedObj.transform.parent) {
						var childObject : GenericObject = child.gameObject.GetComponent(GenericObject);
						if(!childObject.ObjectSelected()) {
							childObject.SelectOrDeselectObject();
						}
					}
				}
				if (GUI.tooltip != "") {
					if(GUI.tooltip == "Selected Type") {
						GUI.Label(Rect(30,295,200,30),GUI.tooltip,"tooltip");
						GUI.Label(Rect(30 - 1,295 + 1,200,30),GUI.tooltip,"tooltipBackground");
					}
					else if(GUI.tooltip == "Number of Selections") {
						GUI.Label(Rect(30 + 250,295,50,30),GUI.tooltip,"tooltip");
						GUI.Label(Rect(30 + 250 - 1,295 + 1,50,30),GUI.tooltip,"tooltipBackground");
					}
					else if(GUI.tooltip == "Select\nAll Type") {
						GUI.Label(Rect(30 + 250 + 50,265,50,30),GUI.tooltip,"tooltip");
						GUI.Label(Rect(30 + 250 + 50 - 1,265 + 1,50,30),GUI.tooltip,"tooltipBackground");
					}
				}
			}
		}
		Group.SelectedGameObject = typeObj.getSpecies(selectedSpeciesInd).getPrefab(); // Set the Selected Game Object to the object referenced above
		previousSelectedTypeInd = selectedTypeInd;
	GUI.EndGroup();

	if(editUIEnabled) {
		GUI.BeginGroup(Rect(Screen.width - 5*editButtonWidth,0,5*editButtonWidth,2*editButtonHeight));
			if(GUI.Button(Rect(0*editButtonWidth,0,editButtonWidth,editButtonHeight),GUIContent("","Clear Selections"),"Deselect")) {
				Debug.Log("StreetFurnitureUI log : Deselect Object(s)");
				DeselectGhostedObjs();
				selectedTool = SelectedTool.None;
			}
			if(GUI.Button(Rect(1*editButtonWidth,0,editButtonWidth,editButtonHeight),GUIContent("","Rotate"),"Rotate")) {
				Debug.Log("StreetFurnitureUI log : Rotate Object(s)");
				if(selectedTool != SelectedTool.Rotation) {
					CloseCurrentTool();
					RotationUI.UpdateObjs = objArray;
					uiAccessor.openUI(UI.Rotation);
					selectedTool = SelectedTool.Rotation;
				} else {
					CloseCurrentTool();
				}
			}
			if(GUI.Button(Rect(2*editButtonWidth,0,editButtonWidth,editButtonHeight),GUIContent("","Move"),"Move")) {
				Debug.Log("StreetFurnitureUI log : Move Object(s)");
				if(selectedTool != SelectedTool.Movement) {
					CloseCurrentTool();
					MovementUI.UpdateObjs = objArray;
					uiAccessor.openUI(UI.Movement);
					selectedTool = SelectedTool.Movement;
				} else {
					CloseCurrentTool();
				}
			}
			if(GUI.Button(Rect(3*editButtonWidth,0,editButtonWidth,editButtonHeight),GUIContent("","Scale"),"Scale")) {
				Debug.Log("StreetFurnitureUI log : Scale Object(s)");
				if(selectedTool != SelectedTool.Scaling) {
					CloseCurrentTool();
					ScalingUI.UpdateObjs = objArray;
					uiAccessor.openUI(UI.Scaling);
					selectedTool = SelectedTool.Scaling;
				} else {
					CloseCurrentTool();
				}
			}
			if(GUI.Button(Rect(4*editButtonWidth,0,editButtonWidth,editButtonHeight),GUIContent("","Delete"),"Delete")) {
				Debug.Log("StreetFurnitureUI log : Delete Object(s)");
				Debug.Log("StreetFurnitureUI log : objArray.length = " + objArray.length);
				CloseCurrentTool();

				for (var gm : GameObject in objArray){
					registerToDeleteGroups.Push((gm as GameObject).transform.parent.parent.gameObject.GetComponent(Group));
					UnityEngine.Object.Destroy(gm);
				}

				objArray = new Array();
				selectedTool = SelectedTool.None;
			}
			if (GUI.tooltip != "") {
				var k : int;
				if(GUI.tooltip == "Clear Selections") k = 0;
				else if(GUI.tooltip == "Rotate") k = 1;
				else if(GUI.tooltip == "Move") k = 2;
				else if(GUI.tooltip == "Scale") k = 3;
				else if(GUI.tooltip == "Delete") k = 4;
				else k = 5;
				if(k <= 4) {
					GUI.Label(Rect(k*editButtonWidth,editButtonHeight,editButtonWidth,editButtonHeight),GUI.tooltip,"tooltip");
					GUI.Label(Rect(k*editButtonWidth - 1,editButtonHeight + 1,editButtonWidth,editButtonHeight),GUI.tooltip,"tooltipBackground");
				}
			}
		GUI.EndGroup();
	}
}

public function RegisterUnityNameToChangeList(unityName : String) {
	sidewalkChangeListPointer++;
	//Debug.Log("StreetFurnitureUI log : sidewalkChangeListPointer = " + sidewalkChangeListPointer);
	if(sidewalkChangeListPointer > changeListOfSidewalks.length) {
		var tempArray : String[] = new String[2*changeListOfSidewalks.length];
		System.Array.Copy(changeListOfSidewalks,tempArray,changeListOfSidewalks.length);
		changeListOfSidewalks = null;
		changeListOfSidewalks = tempArray;
	}
	changeListOfSidewalks[sidewalkChangeListPointer-1] = unityName;
}

public function RegisterEditUIAction() {
	for(var ghostedObj in objArray) {
		(ghostedObj as GameObject).GetComponent(GenericObject).RegisterChangesToParentGroup();
	}
	//DeselectGhostedObjs();
}

public function ObjArrayRegistered () {
	if (selectedTool == SelectedTool.Rotation){
		CloseCurrentTool();
		RotationUI.UpdateObjs = objArray;
		uiAccessor.openUI(UI.Rotation);
		selectedTool = SelectedTool.Rotation;
	} else if (selectedTool == SelectedTool.Movement){
		CloseCurrentTool();
		MovementUI.UpdateObjs = objArray;
		uiAccessor.openUI(UI.Movement);
		selectedTool = SelectedTool.Movement;
	} else if (selectedTool == SelectedTool.Scaling){
		CloseCurrentTool();
		ScalingUI.UpdateObjs = objArray;
		uiAccessor.openUI(UI.Scaling);
		selectedTool = SelectedTool.Scaling;
	}
}

public function UndoSidewalk(unityNameString : String, dataString : String) {
	Debug.Log("StreetFurnitureUI log : Undo sidewalk objects");
	var unityNameInfo : String[] = unityNameString.Split("~"[0]);
	var sidewalkObj : GameObject = GameObject.Find("Road Segments/" + unityNameInfo[0] + "/" + unityNameInfo[1]);
	for(var child : Transform in sidewalkObj.transform/* as Transform[]*/) {
		UnityEngine.Object.Destroy(child.gameObject);
	}
	if(sidewalkObj.GetComponent(Group).PopulateUserObjects(dataString)) {
		return true;
	}
	return false;
}

public function RestoreSidewalkDefault(unityNameString : String, wardNumber : String) {
	Debug.Log("StreetFurnitureUI log : Restore default for sidewalk objects");
	var unityNameInfo : String[] = unityNameString.Split("~"[0]);
	var sidewalkObj : GameObject = GameObject.Find("Road Segments/" + unityNameInfo[0] + "/" + unityNameInfo[1]);
	for(var child : Transform in sidewalkObj.transform/* as Transform[]*/) {
		UnityEngine.Object.Destroy(child.gameObject);
	}
	if(GameObject.Find("DataHandler").GetComponent(UserDataBackend).RestoreDefaultUrbanDesignObjects(unityNameString,sidewalkObj,wardNumber)) {
		return true;
	} else {
		if(sidewalkObj.transform.childCount == 0) return false;
		return true;
	}
}

private function CloseCurrentTool () {
	if (selectedTool == SelectedTool.Rotation){
		RotationUI.UpdateObj = null;
		RotationUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Rotation);
	} else if (selectedTool == SelectedTool.Movement){
		MovementUI.UpdateObj = null;
		MovementUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Movement);
	} else if (selectedTool == SelectedTool.Scaling){
		ScalingUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Scaling);
	}
	selectedTool = SelectedTool.None;
}

private function DeselectGhostedObjs () {
	for(var ghostedObj in objArray) {
		(ghostedObj as GameObject).GetComponent(GenericObject).DeselectObject();
	}
	//Debug.Log("StreetFurnitureUI log : objArray.length = " + objArray.length);
	objArray.Clear();
	objArray = new Array();
}

// Register deleted state after one update loop
private function RegisterDeletedObjects () {
	yield WaitForSeconds(0.00001);
	for (var group : Group in registerToDeleteGroups) {
		(group as Group).RegisterChangesToUI();
		(group as Group).UpdateUnredoList();
	}
	registerToDeleteGroups.Clear();
}

public function EditUIEnabled () {
	return editUIEnabled;
}






