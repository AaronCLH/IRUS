#pragma strict

private var fadingScript : FadeScript;

function Awake () {
	fadingScript = gameObject.Find("FadeHandler").GetComponent(FadeScript);
}

public function startFadeIn () {
	fadingScript.fadeIn();
}





