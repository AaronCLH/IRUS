#pragma strict

public var skin : GUISkin;
public var folder : Texture2D;
public var dottedLine : Texture2D;

private var PLUS_MINUS_BUTTON_WIDTH : int = 35;
private var TAB_BUTTON_SIZE : int = 32;
private var SAVE_BUTTON_SIZE : int = 32;
private var HIDE_BUTTON_SIZE : Vector2 = new Vector2(93.0, 32.0);		// width, height
private var CLOSE_BUTTON_SIZE : Vector2 = new Vector2(93.0, 32.0);		// width, height

private var ORIGINAL_TOP_LEFT : Vector2 = new Vector2(15.0, 15.0);	// x, y
private var topLeft : Vector2;
private var SIZE : Vector2 = new Vector2(400.0, 408.0);		// width, height
private var SIDE_BAR_WIDTH : float = 40.0;
private var BUTTON_AREA_HEIGHT : float = 77.0;

private var MOVE_SPEED : float = 1700.0;
private var moveLeft : boolean;
private var moveRight : boolean;

private var changesMade : boolean;
private var previousFocus : String;

private var onTop : boolean;

private var backend : Backend;

private var teranet : int;
private var previous_info : OwnershipInfo;	// the latest downloaded data
private var current_info : OwnershipInfo;	// stores changes made in GUI (ie the current context in the GUI)

private var NEW_FIELD_PROMPT_TEXT : String = '(Type in a new custom field and press "+")';

private var gui_scroll : Vector2;

private var title_pivot : Vector2;

function Start () {
	backend = GameObject.Find(Backend.SCRIPT_HOST).GetComponent(Backend);
}

function OnEnable () {
	moveLeft = false;
	moveRight = false;
	topLeft = new Vector2(ORIGINAL_TOP_LEFT.x, ORIGINAL_TOP_LEFT.y);
	newContext(-1, null);
}

function Update () {
	// detect changes here (operations like this should be done in Update instead of OnGUI)
	// (also, not an efficient way to detect changes)
	if (!changesMade) {
		if (current_info.Addresses.length == previous_info.Addresses.length) {
			for (var i : int = 0; i < current_info.Addresses.length; i++) {
				if (current_info.Addresses[i] != previous_info.Addresses[i]) {
					changesMade = true;
					break;
				}
			}
		} else changesMade = true;
		if (current_info.AssessmentRollNum != previous_info.AssessmentRollNum) changesMade = true;
		else if (current_info.AssessedValue != previous_info.AssessedValue) changesMade = true;
		else if (current_info.OwnerManager != previous_info.OwnerManager) changesMade = true;
		else if (current_info.ConstructionDate != previous_info.ConstructionDate) changesMade = true;
		else if ((current_info.AdditionalFields == null) ^ (previous_info.AdditionalFields == null)) changesMade = true;
		else if (current_info.AdditionalFields != null) {
			if (current_info.AdditionalFields.length == previous_info.AdditionalFields.length) {
				for (i = 0; i < current_info.AdditionalFields.length; i++) {
					if (current_info.AdditionalFields[i] != previous_info.AdditionalFields[i] ||
							current_info.AdditionalValues[i] != previous_info.AdditionalValues[i]) {
						changesMade = true;
						break;
					}
				}
			} else changesMade = true;
		}
	}
	
	if (moveLeft) {
		topLeft.x -= MOVE_SPEED*Time.deltaTime;
		if (ORIGINAL_TOP_LEFT.x-topLeft.x > SIZE.x) {
			moveLeft = false;
			moveRight = true;
			gameObject.GetComponent(LandUseUI).pushLayerToTop(LandUseLayer.InformationEditor);
		}
	} else if (moveRight) {
		topLeft.x += MOVE_SPEED*Time.deltaTime;
		if (topLeft.x > ORIGINAL_TOP_LEFT.x) {
			topLeft.x = ORIGINAL_TOP_LEFT.x;
			moveRight = false;
		}
	}
}

public function drawFrame () {
	var old_skin : GUISkin = GUI.skin;
	GUI.skin = skin;
	
	title_pivot = new Vector2(topLeft.x+20, topLeft.y+SIZE.y-22);
	
	GUI.DrawTexture(Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y), folder);
	GUIUtility.RotateAroundPivot(-90, title_pivot);
	GUI.Box(Rect(title_pivot.x, title_pivot.y, 999, 25), "INFORMATION EDITOR");
	GUIUtility.RotateAroundPivot(90, title_pivot);
	GUILayout.BeginArea(Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y));
		// side bar
		GUILayout.BeginArea(Rect(0, 0, SIDE_BAR_WIDTH, SIZE.y));
			GUILayout.Space(26);
			GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
				if (GUILayout.Button("", "tabButton", GUILayout.Width(TAB_BUTTON_SIZE), GUILayout.Height(TAB_BUTTON_SIZE))) {
					if (!onTop) moveLeft = true;
				}
			GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
		GUILayout.EndArea();
var tempStatus : boolean = GUI.enabled;		/* these unindented lines are for controlling GUI.enabled depending on different states */
var contentEnabled : boolean = (teranet > 0);
if (!onTop) GUI.enabled = false;	/* if we are not the top layer, we should disable everything so that it does not respond to the clicks */
		// button area
		GUILayout.BeginArea(Rect(SIDE_BAR_WIDTH, SIZE.y-BUTTON_AREA_HEIGHT, SIZE.x-SIDE_BAR_WIDTH, BUTTON_AREA_HEIGHT));
			GUILayout.BeginHorizontal();
				GUILayout.BeginVertical();
					GUILayout.FlexibleSpace();
					GUILayout.BeginHorizontal();
						GUILayout.Space(10);
						if (GUILayout.Button("", "hideButton", GUILayout.Width(HIDE_BUTTON_SIZE.x), GUILayout.Height(HIDE_BUTTON_SIZE.y))) {
							gameObject.GetComponent(LandUseUI).hide();
						}
						if (GUILayout.Button("", "closeButton", GUILayout.Width(CLOSE_BUTTON_SIZE.x), GUILayout.Height(CLOSE_BUTTON_SIZE.y))) {
							gameObject.GetComponent(LandUseUI).closeProcedure();
						}
					GUILayout.EndHorizontal();
				GUILayout.EndVertical();
if (!contentEnabled) GUI.enabled = false;	/* contents should be disabled if teranet <= 0 which means no parcel is selected */
				GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
var tempStatus2 : boolean = GUI.enabled;
if (!changesMade) GUI.enabled = false;	/* if no changes are made, disable the save and revert buttons */
					GUILayout.BeginHorizontal(); GUILayout.Space(40);
							if (GUILayout.Button("", "saveButton", GUILayout.Width(SAVE_BUTTON_SIZE), GUILayout.Height(SAVE_BUTTON_SIZE))) {
								saveContext();
							}
						GUILayout.Box("Save");
					GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
					GUILayout.BeginHorizontal(); GUILayout.Space(40);
						if (GUILayout.Button("", "revertButton", GUILayout.Width(SAVE_BUTTON_SIZE), GUILayout.Height(SAVE_BUTTON_SIZE))) {
							revertContext();
						}
						GUILayout.Box("Revert");
					GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();					
GUI.enabled = tempStatus2;
				GUILayout.FlexibleSpace(); GUILayout.EndVertical();
			GUILayout.EndHorizontal();
		GUILayout.EndArea();
		// fields
		GUILayout.BeginArea(Rect(SIDE_BAR_WIDTH, 0, SIZE.x-SIDE_BAR_WIDTH, SIZE.y-BUTTON_AREA_HEIGHT));
			fields();
		GUILayout.EndArea();
GUI.enabled = tempStatus;
	GUILayout.EndArea();
	
	// format the fields when user changes focus
	if (GUI.GetNameOfFocusedControl()!=previousFocus) {
		if ( GUI.GetNameOfFocusedControl()!="AssessedValue") {
			current_info.AssessedValue = Formatize.Currency(current_info.AssessedValue);
		}
		if (GUI.GetNameOfFocusedControl()!="AssessmentRollNum") {
			current_info.AssessmentRollNum = Formatize.AssessmentRollNum(current_info.AssessmentRollNum);
		}
		if (GUI.GetNameOfFocusedControl()=="NewField") {
			if (nameOfNewField == NEW_FIELD_PROMPT_TEXT) nameOfNewField = "";
		} else {
			if (nameOfNewField == "") nameOfNewField = NEW_FIELD_PROMPT_TEXT;
		}
		previousFocus = GUI.GetNameOfFocusedControl();
	}
	
	GUI.skin = old_skin;
	
	return new Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y);
}

private var nameOfNewField : String = NEW_FIELD_PROMPT_TEXT;
// the actual fields
private function fields () {
	gui_scroll = GUILayout.BeginScrollView(gui_scroll);
		// -------------------------------------------------------
		GUI.skin.box.alignment = TextAnchor.MiddleCenter;
		if (teranet > 0) GUILayout.Box("Teranet PIN: "+teranet);
		else GUILayout.Box("No parcel selected\nClick on a building / parcel !");
		GUI.skin.box.alignment = TextAnchor.MiddleLeft;
		GUILayout.Space(3);
		// -------------------------------------------------------
		for (var i : int = 0; i < current_info.Addresses.length; i++) {
			GUILayout.BeginHorizontal();
				if (i == 0) GUILayout.Box("Addresses", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
				else GUILayout.Box("", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
				current_info.Addresses[i] = GUILayout.TextArea(current_info.Addresses[i]);
				if (GUILayout.Button("-", GUILayout.Width(PLUS_MINUS_BUTTON_WIDTH))) {
					var newCopy : String[] = new String[current_info.Addresses.length-1];
					var counter : int = 0;
					for (var j : int = 0; j < current_info.Addresses.length; j++) {
						if (j != i) {
							newCopy[counter] = current_info.Addresses[j];
							counter++;
						}
					}
					current_info.Addresses = newCopy;
					changesMade = true;
				}
			GUILayout.EndHorizontal();
		}
		GUILayout.BeginHorizontal();
			if (current_info.Addresses.length == 0) GUILayout.Box("Addresses", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
			GUILayout.FlexibleSpace();
			if (GUILayout.Button("+", GUILayout.Width(PLUS_MINUS_BUTTON_WIDTH))) {
				newCopy = new String[current_info.Addresses.length+1];
				for (j = 0; j < current_info.Addresses.length; j++) {
						newCopy[j] = current_info.Addresses[j];
				}
				newCopy[newCopy.Length-1] = "";
				current_info.Addresses = newCopy;
				changesMade = true;
			}
		GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.BeginHorizontal();
			GUILayout.Box("Assessment Roll #", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
			GUI.SetNextControlName ("AssessmentRollNum");
			current_info.AssessmentRollNum = GUILayout.TextField(current_info.AssessmentRollNum);
		GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.BeginHorizontal();
			GUILayout.Box("Assessed Value", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
			GUI.SetNextControlName ("AssessedValue");
			current_info.AssessedValue = GUILayout.TextField(current_info.AssessedValue);
		GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.BeginHorizontal();
			GUILayout.Box("Owner / Manager", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
			current_info.OwnerManager = GUILayout.TextField(current_info.OwnerManager);
		GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.BeginHorizontal();
			GUILayout.Box("Construction Date", GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
			current_info.ConstructionDate = GUILayout.TextField(current_info.ConstructionDate);
		GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
			GUILayout.Label(dottedLine, GUILayout.Width(SIZE.x-SIDE_BAR_WIDTH-20));
		GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
	// -------------------------------------------------------
		GUILayout.Box("Custom Fields");
		if (current_info.AdditionalFields != null) {
			for (i = 0; i < current_info.AdditionalFields.length; i++) {
				GUILayout.BeginHorizontal();
					GUILayout.Box(current_info.AdditionalFields[i], GUILayout.Width((SIZE.x-SIDE_BAR_WIDTH)*0.4));
					current_info.AdditionalValues[i] = GUILayout.TextField(current_info.AdditionalValues[i]);
					if (GUILayout.Button("-", GUILayout.Width(PLUS_MINUS_BUTTON_WIDTH))) {
						newCopy = new String[current_info.AdditionalFields.length-1];
						var newCopyV : String[] = new String[current_info.AdditionalValues.length-1];
						counter = 0;
						for (j = 0; j < current_info.AdditionalFields.length; j++) {
							if (j != i) {
								newCopy[counter] = current_info.AdditionalFields[j];
								newCopyV[counter] = current_info.AdditionalValues[j];
								counter++;
							}
						}
						current_info.AdditionalFields = newCopy;
						current_info.AdditionalValues = newCopyV;
						changesMade = true;
					}
				GUILayout.EndHorizontal();
			}
		}
		GUILayout.BeginHorizontal();
			GUI.SetNextControlName ("NewField");
			nameOfNewField = GUILayout.TextField(nameOfNewField);
			if (GUILayout.Button("+", GUILayout.Width(PLUS_MINUS_BUTTON_WIDTH))) {
				if (nameOfNewField.Trim() != "" && nameOfNewField.Trim() != NEW_FIELD_PROMPT_TEXT) {
					if (current_info.AdditionalFields == null) {
						current_info.AdditionalFields = new String[1];
						current_info.AdditionalValues = new String[1];
						current_info.AdditionalFields[0] = nameOfNewField;
						current_info.AdditionalValues[0] = "";
					} else {
						newCopy = new String[current_info.AdditionalFields.length+1];
						newCopyV = new String[current_info.AdditionalValues.length+1];
						for (j = 0; j < current_info.AdditionalFields.length; j++) {
								newCopy[j] = current_info.AdditionalFields[j];
								newCopyV[j] = current_info.AdditionalValues[j];
						}
						newCopy[newCopy.Length-1] = nameOfNewField;
						newCopyV[newCopyV.Length-1] = "";
						current_info.AdditionalFields = newCopy;
						current_info.AdditionalValues = newCopyV;
					}
					changesMade = true;
					nameOfNewField = NEW_FIELD_PROMPT_TEXT;
					gui_scroll.y += 1000;
				}
			}
		GUILayout.EndHorizontal();
		// -------------------------------------------------------
	GUILayout.EndScrollView();
}


// encapsulates the format functions
class Formatize { 
	static var Numbers : String = "0123456789";
	static function Currency (s : String) {
		var result : String = "";
		var startCopying : boolean = false;
		for (var i : int = 0; i < s.Length; i++) {
			if (Numbers.Contains(s[i].ToString())) {
				if (startCopying || s[i]!="0") {
					result = result + s[i];
					startCopying = true;
				}
			}
		}
		if (result.Length > 2) {
			for (i = result.length-3; i > 0; i -= 3) {
				result = result.Insert(i, ",");
			}
			result = "$" + result;
			return result;
		} else if (result.Length == 0) {
			return "$0";
		} else return "$"+result;
	}
	static function AssessmentRollNum (s : String) {
		var result : String = "";
		for (var i : int = 0; i < s.Length; i++) {
			if (Numbers.Contains(s[i].ToString())) {
				result = result + s[i];
			}
		}
		return result;
	}
}

// format the fields, right now we only have formats for two fields
private function formatize () {
	// format the fields
	current_info.AssessedValue = Formatize.Currency(current_info.AssessedValue); 
	current_info.AssessmentRollNum = Formatize.AssessmentRollNum(current_info.AssessmentRollNum);
}

// revert the context to the latest downlaoded data
private function revertContext () {
	nameOfNewField = "";
	current_info = previous_info.getCopy();	// revert changes to the most updated/saved version in client's side
	changesMade = false;
}

// been modified?
public function changed () {
	return changesMade;
}

public function getAddresses () {
	return current_info.Addresses;
}

// saves the current context
public function saveContext () {
	nameOfNewField = "";
	formatize();
	//current_info.PrintStuff();
	//Debug.Log(current_info.encodeToJSON());
	Debug.Log(teranet.ToString());
	StartCoroutine(current_info.UpdateOnDatabase(teranet.ToString()));
	/*
	yield backend.sendRequest(["update", teranet.ToString(), "OwnershipInfo", current_info.encodeToJSON()]);
	if (backend.getResult() == null) {
		GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay).addMessage("Sorry, we were not able to save the data...");
		return;
	}
	*/
	previous_info = current_info.getCopy();	// back to "no changes" state
	
	changesMade = false;
	return;
}

// forget everything and use t and p to construct the context
public function newContext (t : int, oInfo : OwnershipInfo) {
	nameOfNewField = NEW_FIELD_PROMPT_TEXT;
	if (t < 0) {
		Debug.Log("Create a new ownership info");
		oInfo = new OwnershipInfo();
	}
	previous_info = oInfo;
	teranet = t;
	current_info = oInfo.getCopy();
	Debug.Log("Did this");
	gui_scroll = Vector2(0, 0);
	changesMade = false;
	
	
}

public function setOnTop (b : boolean) {
	onTop = b;
}