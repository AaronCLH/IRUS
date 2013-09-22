#pragma strict

private var mySide : Side;
private var myArea : Area;

static var AllowDetection : boolean;

function setSide (s : Side) {
	mySide = s;
}

function getSide () {
	return mySide;
}

function setArea (a : Area) {
	myArea = a;
}

function getArea () {
	return myArea;
}

function OnMouseDown () {
	if (AllowDetection && !CursorLock.MouseIsOnGUI()) {
		//GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(SidewalkModificationUI).initializeSidewalkEdit(this);
	}
}

static function EnableDetection () {
	AllowDetection = true;
}


static function DisableDetection () {
	AllowDetection = false;
}
