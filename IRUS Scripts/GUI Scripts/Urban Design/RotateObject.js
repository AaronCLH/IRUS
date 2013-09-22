#pragma strict

private var degreePerSec : float = 35;
private var allowRotate : boolean = true;
private var center : Vector3;

function Start () {
	var Rs : Component[];
	var B : Bounds;
	Rs = gameObject.GetComponentsInChildren(MeshRenderer);
	B = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	for (var j : int = 1; j < Rs.Length; j++) {
		B.Encapsulate((Rs[j] as MeshRenderer).bounds);
	}
	center = B.center;
}

function Update () {
	if (allowRotate) {
		//gameObject.transform.rotation *= Quaternion.Euler(0, degreePerSec*Time.deltaTime, 0);
		gameObject.transform.RotateAround(center, Vector3.up, degreePerSec*Time.deltaTime);
	}
}

public function setDegreePerSec (d : float) {
	degreePerSec = d;
}

public function enableRotation () {
	allowRotate = true;
}

public function disableRotation () {
	allowRotate = false;
}