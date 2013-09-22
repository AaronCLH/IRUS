/*#pragma strict

private var showSetback : boolean;
private var showLotline : boolean;
private var ghostBuilding : boolean;

private var backend : Backend;
private var setback : SetbackLines;

private var parcel : Parcel;

private var width : float;
private var height : float;
private var labelling : boolean;

function Start () {
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
}

function OnEnable () {
	newContext(null);
}

public function newContext (p : Parcel) {
	previous_showSetback = true;
	previous_showLotline = true;
	previous_ghostBuilding = false;
	showSetback = false;
	showLotline = false;
	ghostBuilding = true;
	labelling = false;
	parcel = p;
	if (p != null) setback = p.gameObject.GetComponent(SetbackLines);
}

public function drawFrame (p : Parcel, w : float, h : float) {
	width = w;
	height = h;
	
	GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
		GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
			showSetback = GUILayout.Toggle(showSetback, "Show Setbacks");
		GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
		GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
			showLotline = GUILayout.Toggle(showLotline, "Show Lotlines");
		GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
		if (parcel != null && parcel.getBuilding() != null) {
			GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
				ghostBuilding = GUILayout.Toggle(ghostBuilding, "Make Building Translucent");
			GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
		}
	GUILayout.FlexibleSpace(); GUILayout.EndVertical();
}

// for detecting change in toggles
private var previous_showSetback : boolean;
private var previous_showLotline : boolean;
private var previous_ghostBuilding : boolean;
private var showLotline_before_labelling : boolean;	// stores the state of the toggle before user enters labelling ui,
function Update () {
	if (parcel != null && !backend.isProcessing()) {
		if (previous_showSetback != showSetback) {
			if (showSetback) {
				showLotline_before_labelling = showLotline;
				proceedToShowSetBack();
			} else {
				setback.hideSetbacks();
			}
			previous_showSetback = showSetback;
		} else showSetback = setback.isShowingSetback();
		if (previous_showLotline != showLotline) {
			if (showLotline) {
				parcel.showLotlines();
			} else {
				parcel.hideLotlines();
			}
			previous_showLotline = showLotline;
		} else showLotline = parcel.isShowingLotlines();
		if (parcel.getBuilding() != null) {
			if (previous_ghostBuilding != ghostBuilding) {
				if (ghostBuilding) {
					parcel.getBuilding().ghost();
				} else {
					parcel.getBuilding().showFull();
				}
				previous_ghostBuilding = ghostBuilding;
			} else ghostBuilding = parcel.getBuilding().isGhosting();
		}
	}
}
private function proceedToShowSetBack () {
	var sInfo : SetbackInfo = new SetbackInfo();
	yield backend.sendRequest(["retrieve", parcel.gameObject.name, "SetbackInfo"]);
	if (backend.getResult() != "") {
		sInfo.decodeFromJSON(backend.getResult());
		setback.showSetbacks(sInfo.RefArray, sInfo.DistArray);
	} else {
		labelling = true;
		setback.startLabelling();
	}
	// Create new var to store sInfo. Check if it's null before running this function. SetbackInfo in backend.
}

// called by the setback ui
public function doneLabelling (refArray : int[], arg : Object) {
	Debug.Log("Done labelling");
	showLotline = showLotline_before_labelling;
	labelling = false;
	if (refArray == null) {
		return;
	}
	var sInfo : SetbackInfo = new SetbackInfo();
	sInfo.RefArray = refArray;
	// should look up the table here (1.0 for now)
	sInfo.DistArray = new float[refArray.Length];
	for (var i : int = 0; i < refArray.Length; i++) sInfo.DistArray[i] = 1.0;
	Debug.Log(sInfo.encodeToJSON());
	yield backend.sendRequest(["update", parcel.gameObject.name, "SetbackInfo", sInfo.encodeToJSON()]);
	setback.showSetbacks(sInfo.RefArray, sInfo.DistArray);
	labelling = false;
}

public function isLabelling () {
	return labelling;
}*/