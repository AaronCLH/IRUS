/*
#pragma strict

var defaultMaterial : Material;
var loadingText : GameObject;
static var newObject : GameObject;
static var SCRIPT_HOST : String = "Object Manager";

private var uiAccessor : UIControl;
uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);

private var messageDisplayer : MessageDisplay;
messageDisplayer = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);

function LoadObject (objFileName : String) {
	uiAccessor.closeUI(UI.FileBrowser);
	loadingText.active = true;
	loadingText.guiText.text = "Loading...";
	objFileName = "file://" + objFileName;
	var www = new WWW(objFileName);
	yield www;
	if (www.error) {
		messageDisplayer.addMessage(("Error reading .obj file:\n" + www.error));
		loadingText.active = false;
		return;
	}
	ObjReader.use.maxPoints = 65536;
	processObj(www.text);
	loadingText.active = false;	
}

function processObj (content : String) {
	var results = ObjReader.use.ReadFile(content);
	for (result in results) {
		if (result.succeeded) {
			if (result.warnMessage != "") {
				messageDisplayer.addMessage((result.warnMessage));
			}
			newObject = new GameObject("Obj: " + result.objName, MeshRenderer, MeshFilter);
			//newObject.renderer.material = defaultMaterial;	
			newObject.GetComponent(MeshFilter).mesh = result.objMesh;
			newObject.GetComponent(MeshFilter).mesh.RecalculateBounds();
			newObject.active = false;
			ImportObject.NewObject = newObject;	// because ImportWindow uses it
			uiAccessor.openUI(UI.ImportWindow);			
		} else {
			messageDisplayer.addMessage((result.errorMessage));
		}
	}
}
*/