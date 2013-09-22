#pragma strict

/*	This script acts as the driver for importing a .obj model and a bridge between the WebPlayer sandbox and the browser.
	It sends a message to the browser to initiate the file read to get the .obj file and possibly other files.
	Then it will instantiate a new GameObject and attach OBJ.cs to it and let it do its job.
	Whenever OBJ needs a file (e.g. .mtl, .jpeg, .png), it will call this script's requireString (for mtl) or requireTexture (for textures)
	to get them. ** If the user has not selected the file when he/she first selects the .obj file, we will prompt him/her to do another file selecting and
	send a message to the browser for file read */


static var SCRIPT_HOST : String = "Browser";

public var defaultTexture : Texture2D;
public var loadingText : GameObject;

private var messageDisplay : MessageDisplay;
messageDisplay = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);

static var NewObject : GameObject;	// points to the newly created GameObject
private var worker : OBJ;	// the OBJ.cs script on the newly created GameObject, it does the .obj, .mtl parsing

private var showLog : boolean = false;

private var incoming : boolean;
private var numFiles : int;

private var log : String = "";

private var texture : Texture2D;

class FileLib {
	/*
	 *	textures <-> t_fileNames	strings <-> s_fileNames
	 */
	public var textures : Array;
	public var strings : Array;
	public var t_fileNames : Array;
	public var s_fileNames : Array;
	function FileLib () {
		textures = new Array();
		strings = new Array();
		t_fileNames = new Array();
		s_fileNames = new Array();
	}
	public function lookupTexture (fileName : String) {
		for (var i : int; i < t_fileNames.length; i++) {
			if (t_fileNames[i] == fileName) {
				return textures[i];
			}
		}
		return null;
	}
	public function lookupString (fileName : String) {
		for (var i : int; i < s_fileNames.length; i++) {
			if (s_fileNames[i] == fileName) {
				return strings[i];
			}
		}
		return null;
	}
}

private var fileLib : FileLib;

public function requireString (s : String) {
	addLog("checking for "+s);
	var result : String = fileLib.lookupString(getFileName(s));
	if (result != null) {
		addLog("(you've given us "+s+")");
		worker.provideString(result);
		return;
	}
	addLog("missing "+s);
	messageDisplay.addMessage("Oops! You have not picked the file - "+getFileName(s)+".\n"+
					"Please click on the button below the Web Player and uplaod it.",
					gameObject, ["Cancel", "Ignore File", "Upload File"],
					["cancel", "defaultFile", "incomeString"], [null, s, s]);
}

public function requireTexture (s : String) {
	addLog("checking for "+s);
	var result : Texture2D = fileLib.lookupTexture(getFileName(s));
	if (result != null) {
		addLog("(you've given us "+s+")");
		worker.provideTexture(result);
		return;
	}
	addLog("missing "+s);
	messageDisplay.addMessage("Oops! You have not picked the texture - "+getFileName(s)+".\n"+
					"Please click on the button below the Web Player and uplaod it.",
					gameObject, ["Cancel", "Use Default", "Upload Texture"],
					["cancel", "defaultFile", "incomeTexture"], [null, s, s]);
}

public function newObj () {	// web version
	//addLog("newObj");
	if (fileLib == null) {
		fileLib = new FileLib();
		while (true) {
			//messageDisplay.addMessage("Click on the button below Unity Web Player to import an .obj file!");
			incoming = true;
			Application.ExternalCall("ShowButton");
			while (incoming) yield;
			for (var i : int; i < fileLib.s_fileNames.length; i++) {
				if (getExt(fileLib.s_fileNames[i]) == "obj") {
					NewObject = new GameObject((fileLib.s_fileNames[i] as String).Split("."[0])[0]);
					worker = NewObject.AddComponent(OBJ);
					loadingText.active = true;
					yield;
					worker.begin(fileLib.strings[i]);
					return;
				}
			}
			messageDisplay.addMessage("You haven't selected an .obj file.\n"+
					"Please click on the button below the Web Player and try again.",
					gameObject, ["Cancel", "OK"], ["cancel", ""], [null, null]);
		}
	}
}

public function nonweb_newObj (path : String) {	// non-web version
	GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl).closeUI(UI.FileBrowser);
	//Debug.Log("ImportObject log : extension = " + getExt(path));
	if (getExt(path) == "obj" || getExt(path) == "fbx") {
		NewObject = new GameObject(path.Split("/"[0])[path.Split("/"[0]).length-1].Split("."[0])[0]);
		worker = NewObject.AddComponent(OBJ);
		loadingText.active = true;
		yield;
		worker.nonweb_begin(path);
		return;
	}
}

public function finishImport (e : String) {
	fileLib = null;
	loadingText.active = false;
	GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl).closeUI(UI.FileBrowser);	// does nothing when on web
	if (e == "") {
		var Ms : Component[] = NewObject.GetComponentsInChildren(MeshFilter);
		for (var i : int = 0; i < Ms.Length; i++) {
			Ms[i].gameObject.AddComponent(MeshCollider);
		}
		GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl).openUI(UI.ImportWindow);
	} else {
		Debug.Log(e);
		if (NewObject != null) GameObject.Destroy(NewObject);
		messageDisplay.addMessage("Failed to import : "+e);
	}
}

private function getExt (s : String) {
	//addLog("getExt "+s);
	var sr : String[] = s.Split("."[0]);
	//Debug.Log("ImportObject log : sr.Length = " + sr.Length);
	if (sr.Length == 1) return "";
	else return sr[sr.Length-1];
}

private function getFileName (s : String) {
	//addLog("getFileName");
	var sr : String[] = s.Split(["\\"[0], "/"[0]]);
	return sr[sr.Length-1];
}


/* BUTTON FUNCTION */
public function cancel () {
	Application.ExternalCall("HideButton");
	if (NewObject != null) GameObject.Destroy(NewObject);
	fileLib = null;
	messageDisplay.addMessage("Cancelled import");
}

/* BUTTON FUNCTION */
public function incomeTexture (s : String) {
	incoming = true;
	Application.ExternalCall("ShowButton");
	while (incoming) yield;
	requireTexture(s);	// try again see if the user has uploaded the require file
}

/* BUTTON FUNCTION */
public function incomeString (s : String) {
	incoming = true;
	Application.ExternalCall("ShowButton");
	while (incoming) yield;
	requireString(s);	// try again see if the user has uploaded the require file
}

/* BUTTON FUNCTION */
public function defaultFile (s : String) {
	switch (getExt(getFileName(s)).ToLower()) {
		case "mtl":
			fileLib.s_fileNames.Push(getFileName(s));
			fileLib.strings.Push("");
			requireString(s);
			break;
		case "png":		// these are all the supported types of textures
		case "jpeg":
		case "jpg":
			fileLib.t_fileNames.Push(getFileName(s));
			fileLib.textures.Push(defaultTexture);
			requireTexture(s);
	}
}




/* BROWSER FUNCTION */
public function toggleLog (s : String) {	// we can call this from the browser with string 32dj23nrv08hf23dono3nd2398dh2ndjn to show the log on the fly
	if (s == "32dj23nrv08hf23dono3nd2398dh2ndjn") showLog = true;	// for security reason, we are using a key here
}

/* BROWSER FUNCITON */
public function addFile (content : String) {
	//addLog("addFile");
	if (!incoming) return;
	var fileName : String = content.Substring(0, content.IndexOf("*"));
	//content = content.Substring(content.IndexOf("*")+1);
	content = content.Substring(content.IndexOf(",")+1);
	//addLog(content);
	switch (getExt(getFileName(fileName)).ToLower()) {
		case "obj":
		case "mtl":
			fileLib.s_fileNames.Push(getFileName(fileName));
			fileLib.strings.Push(System.Text.Encoding.UTF8.GetString(System.Convert.FromBase64String(content)));
			//addLog(System.Text.Encoding.UTF8.GetString(System.Convert.FromBase64String(content)));
			break;
		case "png":		// these are all the supported types of textures
		case "jpeg":
		case "jpg":
			//addLog("before converting bytes");
			var bytes : byte[] = System.Convert.FromBase64String(content);
			//addLog("after converting byts");
			var t : Texture2D = new Texture2D(1,1);
			t.LoadImage(bytes);
			texture = t;
			fileLib.t_fileNames.Push(getFileName(fileName));
			//addLog("pushed name");
			fileLib.textures.Push(t);
			//addLog("pushed texture");
	}
	numFiles--;
	if (numFiles == 0) incoming = false;
}

/* BROWSER FUNCITON */
public function declareAmount (n : int) {
	addLog("import "+n+" files");
	if (!incoming) return;
	if (n == 0) incoming = false;
	numFiles = n;
}







public function addLog (s : String) {
	log += "\n"+s;
}

// show debug log
private var v : Vector2;
function OnGUI () {
	if (showLog) {
		GUILayout.BeginArea(Rect(0,30,200,Screen.height-30));
		v = GUILayout.BeginScrollView(v);
		GUILayout.TextArea(log);
		GUILayout.EndScrollView();
		GUILayout.EndArea();
	}
}