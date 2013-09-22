#pragma strict

public var fadeTexture : Texture2D;
public var fadeSpeed : float = 2.0;
private var drawDepth = -1000;
private var startAlpha : float;
public var fadingDone : Boolean = true;

private var alpha : float = 0.0; // 1 is opague 0 is fully transparent
private var startTime : float;
private var fading : Boolean;
private var fromAlpha : float;
private var toAlpha : float;
//private var gameScene : Boolean;

function Start () {
	GUI.color.a = startAlpha;
	alpha = startAlpha;
	GUI.depth = drawDepth;
	fading = false;
	fadingDone = true;
}

function Update () {
	if(fading) {
		alpha = Mathf.Lerp(fromAlpha,toAlpha,fadeSpeed*(Time.time - startTime));
		//Debug.Log("FadeScript log : alpha = " + alpha.ToString());
	}
	if(Mathf.Approximately(alpha,toAlpha)) {
		fading = false;
		fadingDone = true;
	}
}

function OnLevelWasLoaded (level : int) {
	if(level == 0) { // Main menu scene
		startAlpha = 1.0;
		fadeSpeed = 2.0;
	} else if (level == 1) { // Tutorial Scene
		startAlpha = 1.0;
		fadeSpeed = 2.0;
	} else if(level == 2) { // King Street current scene
		startAlpha = 1.0;
		fadeSpeed = 0.5;
	}
}

function OnGUI() {
	GUI.color.a = alpha;
	GUI.DrawTexture (Rect (0, 0, Screen.width, Screen.height), fadeTexture);
}

public function fadeIn() {
	startTime = Time.time;
	fromAlpha = 1.0;
	toAlpha = 0.0;
	fading = true;
	fadingDone = false;
}

public function fadeOut() {
	startTime = Time.time;
	fromAlpha = 0.0;
	toAlpha = 1.0;
	fading = true;
	fadingDone = false;
}

public function alphaValue() {
	return alpha;
}

public function isFading() {
	return fading;
}

public function startAlphaValue() {
	return startAlpha;
}






