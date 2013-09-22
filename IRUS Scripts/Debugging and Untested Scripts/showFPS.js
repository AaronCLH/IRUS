#pragma strict
 
public var updateInterval = 0.5;
 
private var accum : float = 0.0;
private var frames : int = 0;
private var timeleft : float;
private var fps : float;
 
function Start() {
	timeleft = updateInterval;  
}
 
function Update() {
	timeleft -= Time.deltaTime;
	accum += Time.timeScale/Time.deltaTime;
	++frames;
 
	if (timeleft <= 0.0) {
		fps = accum/frames;
		timeleft = updateInterval;
		accum = 0.0;
		frames = 0;
	}
}

function OnGUI () {
	GUILayout.BeginArea(Rect(0,0,Screen.width,Screen.height));
		GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			GUILayout.BeginVertical();
				GUILayout.FlexibleSpace();
				GUILayout.Label(fps.ToString("f2"));
			GUILayout.EndVertical();
		GUILayout.EndHorizontal();
	GUILayout.EndArea();
}