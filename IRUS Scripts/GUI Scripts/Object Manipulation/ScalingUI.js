#pragma strict
// The Scaling UI is used for scaling one or many gameObjects at once.  First, the static array UpdateObjs must be initialized from another script (usually the Select Object or the BuildingManipulation Scripts).  It then gets the dimensions of the gameObjects and uses those to make objects bigger or smaller in real world dimensions.  

static var UpdateObjs : GameObject[]; // The objects to move, for Urban Design Purposes

public var skin : GUISkin;
private var messageDisplayer : MessageDisplay; 
private var uiAccessor: UIControl;
private var changesMade: Boolean;
private var dimensionsArray: Vector3 []; // Saves the current Dimensions of the gameObjects
private var originalDimensionsArray: Vector3 [];  // Saves the original Dimensions of the gameObjects before any changes have been made
private var dimensionsArraySize: int;
private var tempStringArray: String[];  // Each set of 3 elements are the intermediate strings for the x, y and z textboxes. 
private var maintainAspectRatio: Boolean;  // Lock the Aspect Ratio
private var sliderx : float;                
private var slidery : float;
private var sliderz : float;

function Awake(){
	messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
	uiAccessor = gameObject.GetComponent(UIControl);
	changesMade = false;
}

function OnEnable () {
	maintainAspectRatio = true;
	dimensionsArraySize = UpdateObjs.length;
	dimensionsArray = new Vector3[dimensionsArraySize];
	originalDimensionsArray = new Vector3[dimensionsArraySize];
	tempStringArray = new String [dimensionsArraySize * 3];
	var j = 0;
	
	// Intialize the dimensions array and the original dimensions array to contain the dimensions of all the gameObjects
	for (var i = 0; i < dimensionsArraySize ; i++){
		dimensionsArray[i] = GetDimensions(UpdateObjs[i]);
		originalDimensionsArray[i] = GetDimensions(UpdateObjs[i]);
		tempStringArray[j] = dimensionsArray[i].x.ToString();
		tempStringArray[j+1] = dimensionsArray[i].y.ToString();
		tempStringArray[j+2] = dimensionsArray[i].z.ToString();
		sliderx = dimensionsArray[i].x;
		slidery = dimensionsArray[i].y;
		sliderz = dimensionsArray[i].z;
		j += 3;
	}
}

function Update () {

}

function OnGUI(){
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	// Create a group that stores the folder used for the menu.  This folder is a style
	GUI.BeginGroup(new Rect((Screen.width*0.5)-150, (Screen.height*0.5)-150, 300, 300), "", "folder");
	GUILayout.BeginArea(Rect(0,0, 300, 400));
			var j = 0;
			GUILayout.Space(10);
			//GUILayout.Box("SCALE OBJECTS", "Text");
			
			GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			GUILayout.BeginVertical();
			GUILayout.Space(5);
			GUILayout.BeginHorizontal();
			
			// Code for the X Dimension
			GUILayout.Label("X: ", "letter", GUILayout.Height(30), GUILayout.Width(40));
			
			// Create a textfield for the x dimension.  The result is saved in the tempStringArray 
			var tempString1 = GUILayout.TextField(tempStringArray[j] + " m" , "input", GUILayout.Height(30), GUILayout.Width(150));
			tempStringArray[j] = tempString1.Substring(0,tempString1.length -2);
			var dim: Vector3;
			GUILayout.EndHorizontal();

			// Creates the horizontal slider
			var tempValue: float = GUILayout.HorizontalSlider(sliderx, 0.00000001, 30, GUILayout.Width(190));
			if (tempValue != sliderx){
				sliderx = tempValue;
					for (var i = 0; i < UpdateObjs.length ; i++){
						dim = dimensionsArray[i];
						if (maintainAspectRatio) {
							SetObjectScale(UpdateObjs[i], sliderx / dim.x, "all");
							dimensionsArray[i] = dim * sliderx / dim.x;
							tempStringArray[j] = sliderx.ToString();
							tempStringArray[j+1] = dimensionsArray[i].y.ToString();
							tempStringArray[j+2] = dimensionsArray[i].z.ToString();
							slidery = dimensionsArray[i].y;
							sliderz = dimensionsArray[i].z;
						}
						else {
							SetObjectScale(UpdateObjs[i], sliderx / dim.x, "x");
							dimensionsArray[i].x = sliderx;
						}
					}
			}
			GUILayout.EndVertical();
			GUILayout.Space(10);
			
			// The okay button to impliment any changes in the textbox.  It checks if the number entered is valid
			if (GUILayout.Button("", "OK", GUILayout.Height(50), GUILayout.Width(50))){
				var xValue: float;
				if (float.TryParse(tempStringArray[j], xValue)){
					sliderx = xValue;
					for (i = 0; i < UpdateObjs.length ; i++){
						dim = dimensionsArray[i];
						if (maintainAspectRatio) {
							// Changes the scale of the object and change the slider and textboxes of other dimensions to maintain the aspect ratio
							SetObjectScale(UpdateObjs[i], xValue / dim.x, "all");
							dimensionsArray[i] = dim * xValue / dim.x;
							tempStringArray[j+1] = dimensionsArray[i].y.ToString();
							tempStringArray[j+2] = dimensionsArray[i].z.ToString();
							slidery = dimensionsArray[i].y;
							sliderz = dimensionsArray[i].z;
						}
						else {
							SetObjectScale(UpdateObjs[i], xValue / dim.x, "x");
							dimensionsArray[i].x = xValue;
						}
						//Debug.Log(dimensionsArray[i].x);
					}					
				}
			}
			GUILayout.FlexibleSpace();
		
			GUILayout.EndHorizontal();
		
			GUILayout.Space(10);
			
			
			GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			GUILayout.BeginVertical();
			GUILayout.Space(5);
			GUILayout.BeginHorizontal();
			GUILayout.Label("Y: ", "letter", GUILayout.Height(30), GUILayout.Width(40));
			var tempString = GUILayout.TextField(tempStringArray[j+1] + " m", "input", GUILayout.Height(30), GUILayout.Width(150));
			tempStringArray[j+1] = tempString.Substring(0,tempString.length - 2);
			GUILayout.EndHorizontal();
			// Create the slider and save its value
			tempValue = GUILayout.HorizontalSlider(slidery, 0.00000001, 30, GUILayout.Width(190));
			// Impliment changes if the sliders new value is different than the old one
			if (tempValue != slidery){
				slidery = tempValue;
				for (i = 0; i < dimensionsArraySize ; i++){
					dim = dimensionsArray[i];					
					if (maintainAspectRatio) {
						SetObjectScale(UpdateObjs[i], slidery / dim.y, "all");
						dimensionsArray[i] = dim * slidery / dim.y;
						tempStringArray[j+1] = slidery.ToString();
						tempStringArray[j] = dimensionsArray[i].x.ToString();
						tempStringArray[j+2] = dimensionsArray[i].y.ToString();
						sliderx = dimensionsArray[i].x;
						sliderz = dimensionsArray[i].z;
					}
					else {
						SetObjectScale(UpdateObjs[i], slidery / dim.y, "y");
						dimensionsArray[i].y = slidery;
					}
					//Debug.Log(dimensionsArray[i].y);
					}				
				}

			
			GUILayout.EndVertical();
			
			
			GUILayout.Space(10);
			if (GUILayout.Button("", "OK", GUILayout.Height(50), GUILayout.Width(50))){
				var yValue: float;
				if (float.TryParse(tempStringArray[j+1], yValue)){
					slidery = yValue;
					for (i = 0; i < dimensionsArraySize ; i++){
						dim = dimensionsArray[i];					
					
						if (maintainAspectRatio) {
							SetObjectScale(UpdateObjs[i], yValue / dim.y, "all");
							dimensionsArray[i] = dim * yValue / dim.y;
							tempStringArray[j] = dimensionsArray[i].x.ToString();
							tempStringArray[j+2] = dimensionsArray[i].y.ToString();
							sliderx = dimensionsArray[i].x;
							sliderz = dimensionsArray[i].z;
						}
						else {
							SetObjectScale(UpdateObjs[i], yValue / dim.y, "y");
							dimensionsArray[i].y = yValue;
						}
						//Debug.Log(dimensionsArray[i].y);
					}				
				}
			}
			GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();

			GUILayout.Space(10);
			
			
			GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			GUILayout.BeginVertical();
			GUILayout.Space(5);
			GUILayout.BeginHorizontal();
			GUILayout.Label("Z: ", "letter", GUILayout.Height(30), GUILayout.Width(40));
			var tempString2 = GUILayout.TextField(tempStringArray[j+2] + " m", "input", GUILayout.Height(30), GUILayout.Width(150));
			tempStringArray[j+2] = tempString2.Substring(0,tempString2.length-2);
			GUILayout.EndHorizontal();
			tempValue = GUILayout.HorizontalSlider(sliderz, 0.00000001, 30, GUILayout.Width(190));
				if (tempValue != sliderz){
					sliderz = tempValue;
						for (i = 0; i < dimensionsArraySize ; i++){
							dim = dimensionsArray[i];	
							if (maintainAspectRatio) {
								SetObjectScale(UpdateObjs[i], sliderz / dim.z, "all");
								dimensionsArray[i] = dim * sliderz / dim.z;
								tempStringArray[j+2] = sliderz.ToString();
								tempStringArray[j] = dimensionsArray[i].x.ToString();
								tempStringArray[j+1] = dimensionsArray[i].y.ToString();
								sliderx = dimensionsArray[i].x;
								slidery = dimensionsArray[i].y;						
							}
							else {
								SetObjectScale(UpdateObjs[i], sliderz / dim.z, "z");
								dimensionsArray[i].z = sliderz;
							}			
						//Debug.Log(dimensionsArray[i].z);
						}
					}
			GUILayout.EndVertical();
			GUILayout.Space(10);			
			if (GUILayout.Button("", "OK", GUILayout.Height(50), GUILayout.Width(50))){
				var zValue: float;
				if (float.TryParse(tempStringArray[j+2], zValue)){
					for (i = 0; i < dimensionsArraySize ; i++){
						sliderz = zValue;
						dim = dimensionsArray[i];	
						if (maintainAspectRatio) {
							SetObjectScale(UpdateObjs[i], zValue / dim.z, "all");
							dimensionsArray[i] = dim * zValue / dim.z;
							tempStringArray[j] = dimensionsArray[i].x.ToString();
							tempStringArray[j+1] = dimensionsArray[i].y.ToString();
							sliderx = dimensionsArray[i].x;
							slidery = dimensionsArray[i].y;
						}
						else {
							SetObjectScale(UpdateObjs[i], zValue / dim.z, "z");
							dimensionsArray[i].z = zValue;
						}			
					//Debug.Log(dimensionsArray[i].z);
					}
				}
			}
			GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();			
						
		GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();	
			maintainAspectRatio = GUILayout.Toggle(maintainAspectRatio, "Lock Aspect Ratio", GUILayout.Height(20), GUILayout.Width(150));
			GUILayout.FlexibleSpace();
			GUILayout.Space(45);
		GUILayout.EndHorizontal();			
		
		
		GUILayout.BeginHorizontal();
		GUILayout.FlexibleSpace();
		if (GUILayout.Button("", "close", GUILayout.Height(45), GUILayout.Width(90))){			
			GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
			closeProcedure();
			GUI.skin = tempSkin;
		}
		GUILayout.Space(10);
		if (GUILayout.Button("", "reset", GUILayout.Height(45), GUILayout.Width(90))){
			for (var k = 0; k < dimensionsArraySize ; k++){
				SetObjectScale(UpdateObjs[k], originalDimensionsArray[k].x / dimensionsArray[k].x, "x");
				SetObjectScale(UpdateObjs[k], originalDimensionsArray[k].y / dimensionsArray[k].y, "y");
				SetObjectScale(UpdateObjs[k], originalDimensionsArray[k].z / dimensionsArray[k].z, "z");
				
				dimensionsArray[k] = Vector3(originalDimensionsArray[k].x, originalDimensionsArray[k].y, originalDimensionsArray[k].z);
				tempStringArray[j+1] = originalDimensionsArray[i].y.ToString();
				tempStringArray[j+1] = originalDimensionsArray[i].y.ToString();
				tempStringArray[j+2] = originalDimensionsArray[i].z.ToString();
			}
			GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		}
		
	GUILayout.FlexibleSpace();
	GUILayout.Space(45);
	GUILayout.EndHorizontal();
	
	GUILayout.Space(10);
	GUILayout.EndArea();
	GUI.EndGroup();
}		

// Consumes a gameObject and returns a Vector3 that represents the dimensiosn of its Bounding Box ( imagine a box in all directions surrounding it fully)			
private function GetDimensions( gm: GameObject){
	var filters = gm.GetComponentsInChildren(MeshFilter);
	// Make sure you Update THIS if your world is expanded!!! THESE
	// Are just arbritrary values
	var low = Vector3(10000000,1000000,1000000);
	var high = Vector3(-1000000, -1000000,-1000000);
	for (var filter : MeshFilter in filters){
		low.x = Mathf.Min(low.x, filter.mesh.bounds.min.x); 
		low.y = Mathf.Min(low.y, filter.mesh.bounds.min.y);
		low.z = Mathf.Min(low.z, filter.mesh.bounds.min.z);
		high.x = Mathf.Max(high.x, filter.mesh.bounds.max.x);
		high.y = Mathf.Max(high.y, filter.mesh.bounds.max.y);
		high.z = Mathf.Max(high.z, filter.mesh.bounds.max.z);
		}
	var boundingBox: Vector3 = high - low;
	boundingBox.x *= gm.transform.localScale.x;
	boundingBox.y *= gm.transform.localScale.y;
	boundingBox.z *= gm.transform.localScale.z;
	return boundingBox;
}

// To scale just x direction, dir must be "x", and same for y and z.  To scale all, dir is "all".  
private function SetObjectScale ( gm: GameObject,  ratio : float , dir: String){

	if (dir == "x"){
		gm.transform.localScale.x *= ratio;
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		return;
	}
	else if (dir == "y"){
		gm.transform.localScale.y *= ratio;
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		return;
	}
	else if (dir == "z"){
		gm.transform.localScale.z *= ratio;
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		return;
	}
	else if (dir == "all"){
		gm.transform.localScale *= ratio;
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterEditUIAction();
		return;
	}
	return;
}


// Closes the procedure correctly.
private function closeProcedure() {
	UpdateObjs = null;
	// Set the tool selected to none for both scripts
	EditObjectsUI.selectedTool = SelectedTool.None;
	EditBuildingUI.selectedTool = SelectedTool.None;
	uiAccessor.closeUI(UI.Scaling);
}
				

				