#pragma strict

/*
 *	usage: call addMessage(content : String) or
 *				addMessage(content : String, g : GameObject, buttons : String[], functions : String[], arguments : Object[])
 *		g			-	where the functions are located (because it uses GameObject.SendMessage)
 *		buttons		-	strings in the buttons
 *		functions	-	functions names (in string) of functions to be called when coressponding buttons is pressed
 *						use "" in the array if you don't need to call a function when the button is clicked
 *		arguments	-	arguments to pass in to the coressponding functions
 *						use void in the array if the target function does not require argument
 */

static var SCRIPT_HOST : String = "First Person Controller";
private var MSG_WIDTH : float = 300.0;			// width of a message
private var MSG_MIN_HEIGHT : float = 110.0;		// minimum height of a message
private var FAN_TIME : float = 0.2;				// time for a message to fan in
private var SLIDE_SPEED : float = 500.0;		// how fast do messages slide up and down when new messages come in
private var MSG_GAP : float = 2.0;				// gap between messages
private var BUTTON_HEIGHT : float = 25.0;
private var BUTTON_MIN_WIDTH : float = 50.0;
private var FAN_ANGLE : float = 90.0;

public var msgSkin : GUISkin;

private var fanSpeed : float;	// = FAN_ANGLE/FAN_TIME (degrees per second)
private var messages : Array;	// main array for storing the current showing messages
private var buffer : Array;		// buffer for storing messages when other scripts addMessage
								// flushed in OnGUI during repaint event (last OnGUI called in a frame)
/*	reason why we shouldn't push objects into messages directly is because
	OnGUI is called multiple times in a frame and the GUI elements need to be consistent
	e.g. if functions are called in this order : OnGUI -> addMessage -> OnGUI
	the GUI elements will be different and will then throw an exception	*/

// three stages a message could be in
enum MsgStage {
	FanIn,
	Active,
	FanOut
}

/*
 * class for message's id because we want some abstraction of the message
 * so that other scripts can kill messages
 */
class MessageID {
	private var id : int;
	function MessageID (i : int) {
		id = i;
	}
	static function msgIDsEqual (m1 : MessageID, m2 : MessageID) {
		return m1.id == m2.id;
	}
}

class Message {
	var height : float;
	var content : String;
	var stage : MsgStage;
	var rotation : float;
	var pivot : Vector2;		// top left of a message dialog
	var creationTime : float;
	var destroyTime : float;
	var id : MessageID;
	var go : GameObject;
	var buttons : String[];
	var funcs : String[];
	var args : Object[];
	static var nextid : int = 0;
	static var DEFAULT_BUTTON : String = "OK";
	function Message (c : String, g : GameObject, b : String[], f : String[], a : Object[]) {
		content = c;
		stage = MsgStage.FanIn;
		creationTime = Time.time;
		id = new MessageID(nextid++);
		if (g != null) {
			go = g;
			buttons = new String[b.Length];
			System.Array.Copy(b, buttons, b.Length);
			funcs = new String[f.Length];
			System.Array.Copy(f, funcs, f.Length);
			args = new Object[a.Length];
			System.Array.Copy(a, args, a.Length);
		} else {
			buttons = new String[1];
			buttons[0] = DEFAULT_BUTTON;
		}
	}
	function kill () {
		destroyTime = Time.time;
		stage = MsgStage.FanOut;
	}
}

function Start () {
	fanSpeed = FAN_ANGLE/FAN_TIME;
	messages = new Array();
	buffer = new Array();
}


/*
 * calculations of the positions and rotations should be done in Update() for efficiency
 */
function Update () {
	var nextPivot : Vector2 = Vector2(-999,0);
	for (var i : int = messages.length-1; i >= 0; i--) {
		var m : Message = (messages[i] as Message);
		if (nextPivot.x == -999) {
			m.pivot = moveVector2(m.pivot, Vector2((Screen.width-MSG_WIDTH)*0.5, (Screen.height-m.height)*0.5)); 
		} else {
			m.pivot = moveVector2(m.pivot, nextPivot); 
		}
		if (m.stage != MsgStage.FanOut) {
			nextPivot = Vector2(m.pivot.x, m.pivot.y+m.height+MSG_GAP);
		}
		if (m.stage == MsgStage.FanIn) {
			m.rotation = Mathf.Max(0, FAN_ANGLE-fanSpeed*(Time.time-m.creationTime));
			if (m.rotation <= 0) m.stage = MsgStage.Active;
		} else if (m.stage == MsgStage.FanOut) {
			m.rotation = (FAN_ANGLE/FAN_TIME)*(Time.time-m.destroyTime);
			// removal handled in OnGui during the repaint event
		}
	}
	if (Input.GetKeyDown(KeyCode.Q)) {	// press Q to dismiss the top non-customized message
		for (i = messages.length-1; i >= 0; i--) {
			if ((messages[i] as Message).stage != MsgStage.FanOut && (messages[i] as Message).go == null) {
				(messages[i] as Message).kill();
				break;
			}
		}
	}
}

private function moveVector2 (from : Vector2, to : Vector2) {
	var step : float = SLIDE_SPEED*Time.deltaTime;
	var diff : Vector2 = to-from;
	if (step > diff.magnitude) {
		return to;
	} else {
		return from+diff.normalized*step;
	}
}

private var tempR : Rect;
function OnGUI () {
	GUI.skin = msgSkin;
	GUI.depth = 0;
	for (var i : int = 0; i < messages.length; i++) {
		var m : Message = (messages[i] as Message);
		if (m.stage == MsgStage.Active) {	// if it's done fanning in and just sitting there
			GUI.Box(Rect(m.pivot.x, m.pivot.y, MSG_WIDTH, m.height), m.content);			
			if (Rect(m.pivot.x, m.pivot.y, MSG_WIDTH, m.height).Contains(Vector2(Input.mousePosition.x,
					Screen.height-Input.mousePosition.y))) {
				CursorLock.SetMouseOnGUI();
			}
			GUILayout.BeginArea(Rect(m.pivot.x, m.pivot.y+m.height-BUTTON_HEIGHT-5, MSG_WIDTH, BUTTON_HEIGHT));
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					for (var j : int = 0; j < m.buttons.Length; j++) {
						if (GUILayout.Button(m.buttons[j], GUILayout.ExpandHeight(true), GUILayout.MinWidth(BUTTON_MIN_WIDTH))) {
							if (m.go != null) if (m.funcs[j] != "") m.go.SendMessage(m.funcs[j], m.args[j]);
							m.kill();
						}
					}
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
			GUILayout.EndArea();
		} else {	// if it's fanning in or out
			GUI.color.a = 1-m.rotation/FAN_ANGLE;
			GUIUtility.RotateAroundPivot(m.rotation, m.pivot);
				GUI.Box(Rect(m.pivot.x, m.pivot.y, MSG_WIDTH, m.height), m.content);			
				if (Rect(m.pivot.x, m.pivot.y, MSG_WIDTH, m.height).Contains(Vector2(Input.mousePosition.x,
						Screen.height-Input.mousePosition.y))) {
					CursorLock.SetMouseOnGUI();
				}
			GUIUtility.RotateAroundPivot(-m.rotation, m.pivot);
			GUI.color.a = 1;
			if (Event.current.type == EventType.repaint && m.rotation > FAN_ANGLE) {
				messages.RemoveAt(i);
				i--;
			}
		}
	}
	/*
	 * handle the buffer here to prevent inconsistency between the OnGUI calls within a frame
	 */
	for (i = 0; i < buffer.length; i++) {
		var b : Message = (buffer[i] as Message);
		GUILayout.BeginArea(Rect(0, 0, MSG_WIDTH, 999));
			GUILayoutUtility.GetRect(GUIContent(b.content), GUI.skin.box,
							GUILayout.ExpandWidth(true), GUILayout.ExpandHeight(false));
			if (Event.current.type == EventType.repaint) {	// only flush buffer when it's in the repaint event
				tempR = GUILayoutUtility.GetLastRect();
				b.height = Mathf.Max(tempR.height, MSG_MIN_HEIGHT);
				b.pivot = Vector2((Screen.width-MSG_WIDTH)*0.5, (Screen.height-b.height)*0.5);
				messages.Push(b);
			}
		GUILayout.EndArea();
	}
	if (Event.current.type == EventType.repaint) buffer.Clear();
	GUI.skin = null;
}

public function addMessage (content : String) {
	content = content.Trim([System.Convert.ToChar(" "),
							System.Convert.ToChar("\n"),
							System.Convert.ToChar("\t")]);
	var m : Message = new Message(content, null, null, null, null);
	buffer.Push(m);
	return m.id;
}

public function addMessage (content : String, go : GameObject, buttons : String[], funcs : String[], args : Object[]) {
	content = content.Trim([System.Convert.ToChar(" "),
							System.Convert.ToChar("\n"),
							System.Convert.ToChar("\t")]);
	var m : Message = new Message(content, go, buttons, funcs, args);
	buffer.Push(m);
	return m.id;
}

public function killMessage (mID : MessageID) {
	for (var m : Object in messages) {
		if (MessageID.msgIDsEqual((m as Message).id, mID)) {
			(m as Message).kill();
			break;
		}
	}
}