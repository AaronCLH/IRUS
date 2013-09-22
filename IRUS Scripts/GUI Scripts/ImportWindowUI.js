#pragma strict

public var skin : GUISkin;
public var background : Texture2D;
public var typeBackground : Texture2D;

private var SIZE : Vector2 = new Vector2(500, 250);
private var FOLDER_TAG_WIDTH : float = 40.0;
private var BUTTON_SIZE : float = 95.0;
private var BUTTON_AREA_HEIGHT : float = 120.0;
private var CLOSE_BUTTON_SIZE : float = 30.0;
private var TEXT_FIELD_WIDTH : float = 250.0;

private var TAGS : String[] = ["Building", "Vegetation", "Street Furniture"];
private var objName : String;
private var selection : boolean[] = new boolean[3];

private var type_area_rect : Rect = new Rect(-1,-1,1,1);

function OnEnable () {
	objName = ImportObject.NewObject.name;
	selection[0] = true;	// initial choice (building)
	selection[1] = false;
	selection[2] = false;
}

function OnGUI () {
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	GUI.DrawTexture(new Rect((Screen.width-SIZE.x)*0.5,(Screen.height-SIZE.y)*0.5,SIZE.x,SIZE.y), background);
	GUILayout.BeginArea(new Rect((Screen.width-SIZE.x)*0.5,(Screen.height-SIZE.y)*0.5,SIZE.x,SIZE.y));
		GUILayout.BeginHorizontal(); GUILayout.Space(10);
		GUILayout.BeginVertical();
			GUILayout.BeginHorizontal();
				GUILayout.Box("SELECT OBJECT TYPE");
				GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
			GUILayout.Label(typeBackground, GUILayout.Width(SIZE.x-FOLDER_TAG_WIDTH), GUILayout.Height(BUTTON_AREA_HEIGHT));
			if (type_area_rect.x == -1 && Event.current.type == EventType.repaint) {
				type_area_rect = GUILayoutUtility.GetLastRect();
			}
			var tempStyle : GUIStyle = new GUIStyle(GUI.skin.box);
			GUI.skin.box.fontSize = 18;
			GUILayout.BeginHorizontal();
				/* object name */
				GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
					GUILayout.Box("Set Object Name", GUILayout.ExpandHeight(false));
					objName = GUILayout.TextField(objName, GUILayout.Width(TEXT_FIELD_WIDTH), GUILayout.Height(25));
				GUILayout.FlexibleSpace(); GUILayout.EndVertical();
				GUILayout.FlexibleSpace();
				/* close,save */
				GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
					GUILayout.BeginHorizontal();
						if (GUILayout.Button("", "closeButton", GUILayout.Width(CLOSE_BUTTON_SIZE), GUILayout.Height(CLOSE_BUTTON_SIZE))) {
							GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl).closeUI(UI.ImportWindow);
						}
						GUILayout.Box("Close");
					GUILayout.EndHorizontal();
					GUILayout.BeginHorizontal();
						if (GUILayout.Button("", "saveButton", GUILayout.Width(CLOSE_BUTTON_SIZE), GUILayout.Height(CLOSE_BUTTON_SIZE))) {
							for (var i : int = 0; i < 3; i++) {
								if (selection[i]) {
									ImportObject.NewObject.tag = TAGS[i];
									ImportObject.NewObject.name = objName;
									if (i == 0) {
										GameObject.Find(ParcelBuildingManager.SCRIPT_HOST).GetComponent(ParcelBuildingManager).addBuildingModel(ImportObject.NewObject);
									} else {
										
										var tempObject = Instantiate(ImportObject.NewObject);
										tempObject.active = false;
										tempObject.AddComponent(MeshCollider);
										//tempObject.GetComponent(BoxCollider).size = tempObject.GetComponentInChildren(mesh).bounds.size;
										//tempObject.GetComponent(BoxCollider).center = Vector3.zero;
										//tempObject.GetComponent(BoxCollider).size = Vector3(10,10,10);
										//tempObject.AddComponent(CombineMesh);
										//GameObject.Find(ObjectLibrary.SCRIPT_HOST).GetComponent(ObjectLibrary).SetTagForAllChildren(tempObject, "InsertedObjectChildren");
										GameObject.Find(ObjectLibrary.SCRIPT_HOST).GetComponent(ObjectLibrary).loadGOToList(tempObject);
									}
									GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl).closeUI(UI.ImportWindow);
									GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay).addMessage("Import Complete!");
									break;
								}
							}
						}
						GUILayout.Box("Save Changes");
					GUILayout.EndHorizontal();
				GUILayout.FlexibleSpace(); GUILayout.EndVertical();
			GUILayout.EndHorizontal();
		GUILayout.EndVertical();
		GUILayout.Space(FOLDER_TAG_WIDTH);	// the folder tag area
		GUILayout.EndHorizontal();
	GUILayout.EndArea();
	
	GUI.skin.box.normal.textColor = Color.black;
	GUI.skin.box.alignment = TextAnchor.MiddleCenter;
	GUI.skin.box.fontSize = 17;
	var tempRect : Rect = new Rect(type_area_rect.x+(Screen.width-SIZE.x)*0.5, type_area_rect.y+(Screen.height-SIZE.y)*0.5,
									type_area_rect.width, type_area_rect.height);
	GUILayout.BeginArea(tempRect); GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
		selection[0] = radioButton("BUILDING", "buildingButton", selection[0]);
		selection[1] = radioButton("VEGETATION", "vegetationButton", selection[1]);
		selection[2] = radioButton("STREET FURNITURE", "furnitureButton", selection[2]);
	GUILayout.FlexibleSpace(); GUILayout.EndHorizontal(); GUILayout.EndArea();
	GUI.skin.box = tempStyle;
	
	GUI.skin = tempSkin;
}

private function radioButton (name : String, style : String, chosen : boolean) {
	var previous : boolean = GUI.enabled;
	GUI.enabled = !chosen;
	var result : boolean = chosen;
	GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
		GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
			if (GUILayout.Button("", style, GUILayout.Width(BUTTON_SIZE), GUILayout.Height(BUTTON_SIZE))) {
				for (var i : int = 0; i < 3; i++) selection[i] = false;
				result = true;
			}
		GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
		GUILayout.Box(name, GUILayout.ExpandWidth(true));
	GUILayout.FlexibleSpace(); GUILayout.EndVertical();
	GUI.enabled = previous;
	return result;
}