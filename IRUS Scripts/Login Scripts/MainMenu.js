#pragma strict
//This script opens and holds the function for the Main Menu/Login Screen. It uses the "MenuSkin" - By Jennica :)

var menuSkin : GUISkin;
//var fadeTexture : Texture;
//
private var fadeScript : FadeScript;
private var animationDone : Boolean;
private var menuOpen : Boolean;
private var guiSleep : Boolean;
private var StartTime : float;

function Awake() {
	fadeScript = gameObject.Find("FadeHandler").GetComponent(FadeScript);
	animationDone = false;
	menuOpen = false;
	guiSleep = false;
	GUI.depth = 1;
}

function OnGUI () {
	//Once the flyThrough animation is complete, the GUI is drawn. 
	GUI.skin = menuSkin;
	if(animationDone && !guiSleep) {
		GUI.Label(Rect(Screen.width*0.5-150, Screen.height*0.1-37.5, 300, 100),"Welcome to IRUS");
		if(GUI.Button(Rect(Screen.width*0.5-125, Screen.height*0.4-125, 250, 250),"","IRUSEye")){
			menuOpen = !menuOpen;
		}
	}
	if(menuOpen && !guiSleep) {
		GUI.BeginGroup(Rect(0,0,Screen.width,Screen.height));
			if (GUI.Button (Rect(Screen.width*0.5-75,Screen.height*0.6-25,150,50),"Begin")){
				fadeScript.fadeOut();
				OpenLevel ("King Street_Current");
			}
			if (GUI.Button (Rect(Screen.width*0.5-75,Screen.height*0.675-25,150,50),"Tutorial")){
				fadeScript.fadeOut();
				OpenLevel ("Tutorial");
			}
			if (GUI.Button (Rect(Screen.width*0.5-75,Screen.height*0.75-25,150,50),"Quit")){
				Application.Quit();
			}
		GUI.EndGroup();
	}
}

function OpenLevel (level : String){
	guiSleep = true;
	while(fadeScript.isFading()) {
		yield;
	}
	Application.LoadLevel(level);
}

public function startFadeIn () {
	fadeScript.fadeIn();
	Debug.Log("MainMenu log : Start login fade in");
	while(fadeScript.isFading()) {
		yield;
	}
	Debug.Log("MainMenu log : Start animation");
	StartAnimation();
}

private function StartAnimation () {
	gameObject.GetComponent(Animation).Play("flyThrough 1");
}

// An animation event will call this function, more on: http://docs.unity3d.com/Documentation/Components/animeditor-AnimationEvents.html
private function AnimationDone () {
	animationDone = true;
}




