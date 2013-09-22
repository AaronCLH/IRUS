#pragma strict

// This Script is attached the camera.  Unlike other UIS, this script always runs.  Its shoots RayCasts and if it hits a Street Furniture or Vegetation Object, then it adds those objects to an array.  This array is passed onto Rotate, Scaling, or Movement UIs by setting UpdateObjs from those scripts to this array of selected Objects. 

private var range: int = 50;
private var hittag1 : String = "Street Furniture";
private var hittag2 : String = "Vegetation";
private var hittag3 : String = "InsertedObjects";
private var hittagChildren : String = "InsertedObjectChildren"; // If a mesh of a child is clicked on
private var selectionEnabled : Boolean;
static var otherUINotOpen: Boolean = true;
private var showFullRotatedTrigger: Boolean = false;

private var objArray: Array;

//private var uiAccessor: UIControl;
private var formattedOutput: String [];

private var scaleEnabled: Boolean = false;
private var scaleInformation: String [];
private var scaleInformationSize: int = 0;
private var uiAccessor: UIControl;
public var skin : GUISkin;
public var dottedLine : Texture2D;
private var tempSkin: GUISkin;
/*  Definition exists in Edit Building
public enum SelectedTool {
	None,
	Rotation,
	Scaling,
	Movement
}
*/
static var selectedTool:SelectedTool = SelectedTool.None;

function Start () {
	selectionEnabled = false;
	objArray = new Array ();
	uiAccessor = gameObject.Find("UI Handler").GetComponent(UIControl);
}

function Update () {
	if (!otherUINotOpen) showFullRotatedTrigger = true;
	if (otherUINotOpen && showFullRotatedTrigger) {
		var tempArray = gameObject.FindGameObjectsWithTag("InsertedObjects");
		for (var gm: GameObject in tempArray){
			gm.GetComponent(GhostSelectedObjects).showFull();
		}
		showFullRotatedTrigger = false;
	}
	
	if (Input.GetMouseButtonDown(0)){
		var ray = Camera.main.ScreenPointToRay(Input.mousePosition);
		var hit : RaycastHit;
		if (Physics.Raycast(ray, hit, range) && otherUINotOpen){
			
			// If the tag of the object is already selected, then Deselect the Object by removing it from the objArray and then change its tag back to InsertedObjects.  
			if (hit.transform.tag == "Selected"){
				var tempArr = Array();
				// Recreate the obj array by going through the array and adding it to the new array only if its not the object clicked on
				for (var gm: GameObject in objArray/* as GameObject[]*/){
					if (gm == hit.transform.gameObject){
						gm.tag = "InsertedObjects";
						gm.GetComponent(GhostSelectedObjects).showFull();   // UnGhost the object
					}
					else {
						tempArr.Add(gm);
					}
				}
				objArray = tempArr;
				Destroy(hit.transform.gameObject.GetComponent(GhostSelectedObjects));
				Debug.Log("deselect");

			}			
			
			// if the tag matches, then add it to the objArray				
			else if (hit.transform.tag == hittag1 || hit.transform.tag == hittag2 || hit.transform.tag == hittag3){
				hit.transform.tag = "Selected";
				objArray.Add(hit.transform.gameObject);
				hit.transform.gameObject.AddComponent(GhostSelectedObjects);  // This component is necessary for ghosting it
				hit.transform.gameObject.GetComponent(GhostSelectedObjects).ghost();  // Ghost the selected objects

				selectionEnabled = true;
				Debug.Log(hit.transform.gameObject.GetComponent(GenericObject).ReturnObjectDetails());		
				Debug.Log("object clicked");
			}
			else if (hit.transform.tag == hittagChildren){  // If the child of the object selected is clicked on, then move up the hierarchy to find the parent and add the parent to the objArray 
				var possibleTags = Array();
				possibleTags.Add(hittag1);
				possibleTags.Add(hittag2);
				possibleTags.Add(hittag3);
				possibleTags.Add("Selected");
				// Finds any object that has any of the tags in possibleTags
				var selectedObject = FindParentWithTags(hit.transform.gameObject, possibleTags);  
				if (selectedObject != null){
					Debug.Log(selectedObject.tag);
					// If the parent already has been selected, then unselect it and add it to the objArray
					if (selectedObject.tag == "Selected"){
						var tempArr2 = Array();
						for (var gm: GameObject in objArray/* as GameObject[]*/){
							if (gm == selectedObject){
								gm.tag = "InsertedObjects";
								gm.GetComponent(GhostSelectedObjects).showFull();
							}
							else {
								tempArr2.Add(gm);
							}
						}
						objArray = tempArr2;
						Destroy(hit.transform.gameObject.GetComponent(GhostSelectedObjects));
						Debug.Log("deselect");
					}					
					// If it hasnt been selected, then changes its tag to selected and add it to the objArray
					else {	
						selectedObject.tag = "Selected";
						selectedObject.AddComponent(GhostSelectedObjects);
						selectedObject.GetComponent(GhostSelectedObjects).ghost();
						objArray.Add(selectedObject);
						selectionEnabled = true;
						Debug.Log(hit.transform.gameObject.GetComponent(GenericObject).ReturnObjectDetails());
						Debug.Log("selected object found");
					}
				}
			}
			else Debug.Log("Not Selected but raycast worked");
		}
	}
}

// This function looks for the first parent of gm that has the same tag as any of the strings contained in strs and null if no such object exists 
function FindParentWithTags(gm: GameObject, strs: Array){
	var levels: int = 4;
	while (levels > 0){
		for (var str: String in strs/* as String[]*/){
			if (gm.transform.parent.gameObject.tag == str){
				return gm.transform.parent.gameObject;
			}
		}
		levels--;
	}
	return null;
}

function OnGUI(){
	// Store the old skin in a variable so that we can return to that skin once we close this GUI
	tempSkin = GUI.skin;
	GUI.skin = skin;
	
	GUI.BeginGroup(new Rect(15, 15, 230, 400));//, "", "Folder");
		GUILayout.BeginArea(new Rect (0,0, 230, 400), "", "Folder");
			
			GUILayout.Space(7);
			GUILayout.Box("EDIT OBJECTS", "Text");
			if (selectionEnabled){
				
				GUILayout.Box("Number of Objects Selected: " + objArray.length, "Text2");	
				// Select all the objects from the street by going through all the objects in the same level in the hierarchy and checking and adding them to the objArray and changing their tags to Selected
				if (GUILayout.Button("Select all from this street", "Select", GUILayout.Width(185))){
					var ob: Object = objArray[objArray.length -1];
					for (var child: Transform in (ob as GameObject).transform.parent/* as Transform[]*/){
						if (child.gameObject.tag != "Selected"){
							child.gameObject.tag = "Selected";
							child.gameObject.AddComponent(GhostSelectedObjects);
							child.gameObject.GetComponent(GhostSelectedObjects).ghost();
							objArray.Add(child.gameObject);
						}
					}
				}
				GUILayout.Space(10);
				GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));	
				GUILayout.FlexibleSpace();
			
				GUILayout.BeginHorizontal();
					GUILayout.FlexibleSpace();
						GUILayout.BeginVertical();
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("","rotate", GUILayout.Width(50), GUILayout.Height(50))){
									// Rotate Objects
									if (selectedTool != SelectedTool.Rotation){
										CloseCurrentTool();
										RotationUI.UpdateObjs = objArray;
										uiAccessor.openUI(UI.Rotation);
										selectedTool = SelectedTool.Rotation;
									}	
								}
								GUILayout.Label("Rotate", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();
							
							GUILayout.Space(10);
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "move", GUILayout.Width(50), GUILayout.Height(50))){
									if (selectedTool != SelectedTool.Movement){
										CloseCurrentTool();
										MovementUI.UpdateObjs = objArray;
										uiAccessor.openUI(UI.Movement);
										selectedTool = SelectedTool.Movement;
									}	
								}
								GUILayout.Label("Move", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();
						
							GUILayout.Space(10);
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "scale", GUILayout.Width(50), GUILayout.Height(50))){		
									if (selectedTool != SelectedTool.Scaling){
										CloseCurrentTool();
										ScalingUI.UpdateObjs = objArray;
										uiAccessor.openUI(UI.Scaling);
										selectedTool = SelectedTool.Scaling;
									}
								}
								GUILayout.Label("Scale", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();	
						
							GUILayout.Space(10);
						
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "delete", GUILayout.Width(50), GUILayout.Height(50))){
									CloseCurrentTool();
									for (var gm : GameObject in objArray/* as GameObject[]*/){
										Destroy(gm);
									}
									objArray = new Array();
									//objArraySize = 0;
									selectionEnabled = false;
									
								}
								GUILayout.Label("Delete", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();
							
						GUILayout.EndVertical();
					GUILayout.FlexibleSpace();
					GUILayout.Space(40);
				GUILayout.EndHorizontal();
			
				GUILayout.FlexibleSpace();
				GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));
				GUILayout.Space(10);	
				
				GUILayout.BeginHorizontal();
					GUILayout.Space(10);
					if (GUILayout.Button("", "close", GUILayout.Width(93), GUILayout.Height(32))){
						CloseSelectionMenu();
					}
				GUILayout.EndHorizontal();
			
				GUILayout.Space(10);
			} else if (!selectionEnabled){
				GUILayout.Box("No Objects Have Been Selected", "Text2");	
				// Select all the objects from the street by going through all the objects in the same level in the hierarchy and checking and adding them to the objArray and changing their tags to Selected
				if (GUILayout.Button("Select all from this street", "Select", GUILayout.Width(185))){}
				GUILayout.Space(10);
				GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));
				GUILayout.FlexibleSpace();
				
				GUILayout.BeginHorizontal();
				
					GUILayout.FlexibleSpace();

						GUILayout.BeginVertical();
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("","rotate", GUILayout.Width(50), GUILayout.Height(50))){
								}
								GUILayout.Label("Rotate", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();
							
							GUILayout.Space(10);
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "move", GUILayout.Width(50), GUILayout.Height(50))){
								}
								GUILayout.Label("Move", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();
						
							GUILayout.Space(10);
							
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "scale", GUILayout.Width(50), GUILayout.Height(50))){		
								}
								GUILayout.Label("Scale", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();	
						
							GUILayout.Space(10);
						
							GUILayout.BeginHorizontal();
								if (GUILayout.Button("", "delete", GUILayout.Width(50), GUILayout.Height(50))){
								}
								GUILayout.Label("Delete", "Text", GUILayout.Height(50));
							GUILayout.EndHorizontal();

						GUILayout.EndVertical();
					GUILayout.FlexibleSpace();
					GUILayout.Space(40);	
				
				GUILayout.EndHorizontal();
		
				GUILayout.FlexibleSpace();
				GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));
				GUILayout.Space(10);	
		
				GUILayout.BeginHorizontal();
					GUILayout.Space(10);
					if(GUILayout.Button("", "close", GUILayout.Width(93), GUILayout.Height(32))){
						CloseSelectionMenu();
					}
				GUILayout.EndHorizontal();
		
				GUILayout.Space(10);
			}
		
		GUILayout.EndArea();
	GUI.EndGroup();
		
	
}

// Close this menu
function CloseSelectionMenu(){
	for (var gm : GameObject in objArray/* as GameObject[]*/){
		gm.tag = "InsertedObjects";
		gm.GetComponent(GhostSelectedObjects).showFull();
	}
	objArray = new Array();
	//objArraySize = 0;
	selectionEnabled = false;
	CloseCurrentTool();	
	GUI.skin = tempSkin;
	uiAccessor.closeUI(UI.EditObjects);
}	

function CloseCurrentTool(){
	if (selectedTool == SelectedTool.Rotation){
		RotationUI.UpdateObj = null;
		RotationUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Rotation);
		//Debug.Log("Rotation Tool has been closed");
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



