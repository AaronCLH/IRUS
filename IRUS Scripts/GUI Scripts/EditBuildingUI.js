#pragma strict

//Edit Objects Toolbar GUI
public var skin : GUISkin;
public var dottedLine : Texture2D;
static var UpdateObjs: GameObject[];
static var UpdateObj: GameObject;
private var uiAccessor: UIControl;
public enum SelectedTool {
	None,
	Rotation,
	Scaling,
	Movement
}
static var selectedTool: SelectedTool = SelectedTool.None;

function Awake(){
	uiAccessor = gameObject.GetComponent(UIControl);
}

function Start () {

}

function Update () {

}

function OnGUI(){
	///////////////////////////////////////////Begin Ruth
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	GUI.BeginGroup(new Rect(15, 15, 230, 400));//, "", "Folder");
		GUILayout.BeginArea(new Rect (0,0, 230, 400), "", "Folder");
		GUILayout.Space(7);
		GUILayout.Box("EDIT OBJECTS", "Text");
		GUILayout.Space(5);
		GUILayout.Box("You have selected a building.", "Text2");
		
		GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));
		//GUI.DrawTexture(Rect(10,345,190,6),dottedLine,ScaleMode.StretchToFill,true,10.0f);
				
	GUILayout.FlexibleSpace();
		
	GUILayout.BeginHorizontal();
	GUILayout.FlexibleSpace();
		GUILayout.BeginVertical();
			
			GUILayout.BeginHorizontal();
			if (GUILayout.Button("","rotate", GUILayout.Width(50), GUILayout.Height(50))){
				if (selectedTool != SelectedTool.Rotation){
					CloseCurrentTool();
					RotationUI.UpdateObj = UpdateObj;
					RotationUI.UpdateObjs = UpdateObjs;
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
					MovementUI.UpdateObj = UpdateObj;
					MovementUI.UpdateObjs = UpdateObjs;
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
					if (UpdateObjs != null){
					ScalingUI.UpdateObjs = UpdateObjs;
					}
					else {	
						var tempArray = new Array();
						tempArray.Add(UpdateObj);
						ScalingUI.UpdateObjs = tempArray;
					}
					uiAccessor.openUI(UI.Scaling);
					selectedTool = SelectedTool.Scaling;
				}
			}	
			GUILayout.Label("Scale", "Text", GUILayout.Height(50));
			GUILayout.EndHorizontal();
			
		GUILayout.Space(10);
					
		GUILayout.EndVertical();
	GUILayout.FlexibleSpace();
	GUILayout.Space(25);	
	GUILayout.EndHorizontal();
		
	GUILayout.FlexibleSpace();
	
		GUILayout.Box("","dottedLine",GUILayout.Width(185), GUILayout.Height(6));
		GUILayout.Space(10);	
		GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			//if (GUILayout.Button("", "hide", GUILayout.Width(93), GUILayout.Height(32))){
				//hide menu
				//GUI.skin = tempSkin;
			//}		
			//GUILayout.Space(5);
			if (GUILayout.Button("", "close", GUILayout.Width(93), GUILayout.Height(32))){
				UpdateObjs = null;
				UpdateObj = null;
				CloseCurrentTool(); 
				GUI.skin = tempSkin;
				uiAccessor.closeUI(UI.EditBuilding);
			}

			//GUILayout.Space(35);
		GUILayout.EndHorizontal();
		
	GUILayout.Space(10);
		
	GUILayout.EndArea();
	GUI.EndGroup();
	
/////////////////////////////////////End RUth	
}

function CloseCurrentTool(){
	if (selectedTool == SelectedTool.Rotation){
		RotationUI.UpdateObj = null;
		RotationUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Rotation);
		//Debug.Log("Rotation Tool has been closed");
	}
	else if (selectedTool == SelectedTool.Movement){
		MovementUI.UpdateObj = null;
		MovementUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Movement);
	}
	else if (selectedTool == SelectedTool.Scaling){
		ScalingUI.UpdateObjs = null;
		uiAccessor.closeUI(UI.Scaling);
	}
	selectedTool = SelectedTool.None;
}	
	
	
	
	
	
	
	
