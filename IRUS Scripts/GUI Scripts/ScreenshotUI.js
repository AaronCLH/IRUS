// THIS SCRIPT NEEDS SERIOUS WORK. IT DOES NOT CORRECTLY SAVE AT THIS POINT (may not even be possible to correctly save in web mode).
// FURTHERMORE, IT NEEDS TO BE TEXTURED, AND THE LOGIC COULD USE AN OVERHAUL TOO. I WILL SAVE THE COMMENTS ON THIS TO NOT LEAD
// YOU ASTRAY. WE RAN OUT OF TIME TO WORK ON THIS (sorry).



#pragma strict

import System;

private var uiAccessor : UIControl;

//UI1 Variables
private var screenshot : Texture;
private var screenshotsSaved : int = 0;
private var stringToEdit : String = "Screenshot";
private var MAX_SAVES : int = 10;
private var showScreenshot : boolean = false;

function Start () {
	uiAccessor = gameObject.GetComponent(UIControl);
}

function OnEnable(){	
	UniFileBrowser.use.SetWindowTitle("Select Folder to Save Screenshot");
	UniFileBrowser.use.SendWindowCloseMessage(FileWindowClose);
	UniFileBrowser.use.OpenFolderWindow (true, SaveScreenShot);

}

private function SaveScreenShot (path : String) {
	if (path.Length != 0){
		var currTime:String = "" + DateTime.Now;
		var strlen:int  = currTime.Length;
		var newString: String = "";
		// Put date in friendly format
		for (var i = 0; i < strlen ; i++){
			if (currTime[i] != '/' && currTime[i] != ' ' && currTime[i] != '\n' && currTime[i] != '\t' && currTime[i] != ':') newString += currTime[i];
			else newString += ".";
		}
		// Create the path using the Data
		path += "/" + "IrusScreenshot" + newString + ".png";
		Application.CaptureScreenshot(path);
	}
}

private function FileWindowClose() {
	uiAccessor.closeUI(UI.Screenshot);
}

// Old Screen Shot Method
/*
private function loadScreenshot(fileName : String) {
	uiAccessor.closeUI(UI.Screenshot);
	Application.CaptureScreenshot(fileName);
	screenshotsSaved++;
	//yield new WaitForSeconds(0.35);
	var www : WWW = new WWW("file:///" + Application.dataPath + "/../" + fileName);
	while (www.error != null) {
		yield;
		www = new WWW("file:///" + Application.dataPath + "/../" + fileName);
	}
	uiAccessor.openUI(UI.Screenshot);
	screenshot = www.texture;
	showScreenshot = true;
}

function OnGUI() {
	GUILayout.BeginArea(Rect(0,Screen.height*3/5, Screen.width/4, Screen.height/5));
    	GUILayout.FlexibleSpace();
    	GUILayout.BeginVertical();
    		GUILayout.BeginHorizontal();
    			GUILayout.Box("Set Filename: ", GUILayout.Width(Screen.width/9));
    			stringToEdit = GUILayout.TextField(stringToEdit, 30);
    		GUILayout.EndHorizontal();
    		if (GUILayout.Button("Capture the Screenshot") && screenshotsSaved < MAX_SAVES) {
      			loadScreenshot(stringToEdit + ".png");
    		}
    		if (GUILayout.Button("Close Screenshot Menu")) {
    			showScreenshot = false;
    			uiAccessor.closeUI(UI.Screenshot);
    		}
    	GUILayout.EndHorizontal();
    GUILayout.EndArea();
    			
    if (showScreenshot) {
    	GUILayout.BeginArea(Rect (0, 0, Screen.width/5, Screen.height/4));
    		GUILayout.BeginVertical();
    		GUILayout.Box(stringToEdit + ".png");
    			GUILayout.BeginHorizontal();
    				if (GUILayout.Button("Keep")) {
    					showScreenshot = false;
    					}
    				else if (GUILayout.Button("Delete")) {
    					DestroyImmediate(screenshot);
    					showScreenshot = false;
    				}    						
    			GUILayout.EndHorizontal();
    			GUILayout.Label(screenshot);
    			GUILayout.FlexibleSpace();
    		GUILayout.EndVertical();
    	GUILayout.EndArea();
    }
}

		
function OnGUI(){
	
	GUILayout.BeginArea(new Rect(0,0,Screen.width/3, Screen.height));
		if (GUILayout.Button("Close")){
			uiAccessor.closeUI(UI.Screenshot);
		}
		else if (GUILayout.Button("Take Screen Shot")){
			 var path = EditorUtility.SaveFolderPanel("Select a Folder To Save Your Screenshot", "", "");
			 if (path.Length != 0){
			 	path += "Myfile.png";
			 	Application.CaptureScreenshot(path);
			 }
		Debug.Log(path);
		}
		
	GUILayout.EndArea();
}			 	

*/