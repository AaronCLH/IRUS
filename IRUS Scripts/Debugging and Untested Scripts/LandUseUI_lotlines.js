/*#pragma strict

// Current state variables for the toggle
private var lotLinesOn : boolean;
private var setbacksOn : boolean; 
private var eachLotLineOn : boolean[] = new boolean[SetbackLines.NUM_LINE_TYPES];
private var eachSetbackOn : boolean[] = new boolean[SetbackLines.NUM_LINE_TYPES];

// State variables for the toggle on the previous update, used to check for changes.
private var prevLLon : boolean;
private var prevSBon : boolean;
private var prevLLsOn : boolean[] = new boolean[SetbackLines.NUM_LINE_TYPES];
private var prevSBsOn : boolean[] = new boolean[SetbackLines.NUM_LINE_TYPES];

private var setbacks : SetbackLines;
private var parcel : Parcel;
private var backend : Backend;

private var sInfo : SetbackInfo; // The type SetbackInfo is defined within the Backend Script

private var TAB : int = 20;

function Start () {
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
	resetVars();
}

function Update () { 	
	// Used to check for changes in toggle variables
	if (prevLLon != lotLinesOn) {
		if (lotLinesOn == true) {
			parcel.showLotlines();
			for (var bool : boolean in eachLotLineOn) {
				bool = true;
			}
		} else {
			parcel.hideLotlines();
			for (bool in eachLotLineOn) {
				bool = false;
			}
		}
	}	
	if (prevSBon != setbacksOn) {
		if (setbacksOn == true) {
			proceedToShowSetback();
			for (bool in eachSetbackOn) {
				bool = true;
			}
		} else {
			setbacks.hideSetbacks();
			for (bool in eachSetbackOn) {
				bool = false;
			}
		}
	}
	for (var i : int = 0; i < SetbackLines.NUM_LINE_TYPES; i++) {
		if (eachLotLineOn[i] != prevLLsOn[i]) {
			//if (eachLotLineOn[i] == true) setbacks.showLLofType(i);
			//else setbacks.hideLLofType(i);
		} else if (eachSetbackOn[i] != prevSBsOn[i]) {
			if (eachSetbackOn[i] == true) setbacks.showSetbackOfType(i);
			else setbacks.hideSetbackOfType(i);
		}
	}
	updatePrevious();
}

public function drawFrame (p : Parcel, w : float, h : float) {
	if (parcel == null || parcel != p) {
		parcel = p;
		setbacks = parcel.gameObject.GetComponent(SetbackLines);
		resetVars();
	}
	GUILayout.BeginHorizontal();
		GUILayout.BeginVertical();
			lotLinesOn = GUILayout.Toggle(lotLinesOn, "Show Lot Lines");
			GUI.enabled = lotLinesOn;
			for (var i : int = 0; i < SetbackLines.NUM_LINE_TYPES; i++) {
				GUILayout.BeginHorizontal();
					GUILayout.Space(TAB);
					eachLotLineOn[i] = GUILayout.Toggle(eachLotLineOn[i], "Show " + SetbackLines.LINE_TYPES[i]);
				GUILayout.EndHorizontal();
			}
			GUI.enabled = true;
		GUILayout.EndVertical();
		GUILayout.BeginVertical();
			setbacksOn = GUILayout.Toggle(setbacksOn, "Show Setback Lines");
			GUI.enabled = setbacksOn;
			for (i = 0; i < SetbackLines.NUM_LINE_TYPES; i++) {
				GUILayout.BeginHorizontal();
					GUILayout.Space(TAB);
					eachSetbackOn[i] = GUILayout.Toggle(eachSetbackOn[i], "Show " + SetbackLines.LINE_TYPES[i]);
				GUILayout.EndHorizontal();
			}
			GUI.enabled = true;
		GUILayout.EndVertical();
	GUILayout.EndHorizontal();
}				

private function proceedToShowSetback() {
	if (sInfo != null) {
		setbacks.showSetbacks(sInfo.RefArray, sInfo.DistArray);
		return;
	}
	sInfo = new SetbackInfo();
	yield backend.sendRequest(["retrieve", parcel.gameObject.name, "SetbackInfo"]);
	if (backend.getResult() != "") {
		sInfo.decodeFromJSON(backend.getResult());
		setbacks.showSetbacks(sInfo.RefArray, sInfo.DistArray);
	} else {
		setbacks.startLabelling();
	}
}

private function updatePrevious() {
	prevLLon = lotLinesOn;
	prevSBon = setbacksOn;
	System.Array.Copy(eachLotLineOn, prevLLsOn, SetbackLines.NUM_LINE_TYPES);
	System.Array.Copy(eachSetbackOn, prevSBsOn, SetbackLines.NUM_LINE_TYPES);
}	

private function resetVars() {
	lotLinesOn = false;
	setbacksOn = false;
	prevLLon = false;
	prevSBon = false;
	for (var i : int = 0; i < eachLotLineOn.length; i++) {
		eachLotLineOn[i] = false;
		eachSetbackOn[i] = false;
		prevLLsOn[i] = false;
		prevSBsOn[i] = false;
	}
}			*/
			