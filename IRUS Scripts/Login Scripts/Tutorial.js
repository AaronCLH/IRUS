#pragma strict
//This script opens and holds the function for the Tutorial Scene. It uses the "TutorialSkin"
var menuSkin : GUISkin;

private var menuOpen : Boolean;
private var messageWindow : Boolean;
private var fadeScript : FadeScript;

function Awake() {
	menuOpen = false;
	messageWindow = true;
	fadeScript = gameObject.Find("FadeHandler").GetComponent(FadeScript);
}

function Start () {
	fadeScript.fadeIn();
}

//When the user selects the IRUSEye, the Back button is drawn
//The MessageWindow is drawn at the beginning of the scene
function OnGUI () {
	GUI.skin = menuSkin;
	if (GUI.Button (Rect(15, 15, 150, 150), "", "IRUSEye")) {
		menuOpen = true;
	}
	if (menuOpen) {
		OpenMenu();
	}
	if(messageWindow) {
		MessageWindow();
	}
}

//When the Back button is selected, the user is redirected to the Main Menu scene
function OpenMenu () {
	GUI.BeginGroup(Rect(0,0,Screen.width,Screen.height));
		if (GUI.Button (Rect(50,175,80,35),"Back")){
			fadeScript.fadeOut();
			OpenLevel ("Main Menu");
		}
	GUI.EndGroup();
}

function MessageWindow() {
	GUI.BeginGroup(Rect(0,0,Screen.width,Screen.height));
		GUI.Button (Rect(Screen.width*0.5-200, Screen.height*0.5-50, 400, 100), "This Option is Currently Unavailable", "MessageWindow");
	GUI.EndGroup();
}

function OpenLevel (level : String){
	while(fadeScript.isFading()) {
		yield;
	}
	Application.LoadLevel(level);
}