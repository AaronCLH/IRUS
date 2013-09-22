#pragma strict

private var otherSide : Side;
private var mySide : Side;
private var innerLine : GameObject;
private var outerLine : GameObject;
private var hasCrosswalk : boolean;

public function setOtherSide (s : Side) {
	otherSide = s;
}

public function setMySide (s : Side) {
	mySide = s;
}

function Start () {
	hasCrosswalk = false;
}

function OnMouseDown () {
	if (hasCrosswalk) {
		innerLine.renderer.enabled = false;
		outerLine.renderer.enabled = false;
		hasCrosswalk = !hasCrosswalk;
	} else {
		hasCrosswalk = !hasCrosswalk;
		if (innerLine == null) {
			innerLine = GameObject.Instantiate(TrafficLaneManager.crosswalkLine);
			outerLine = GameObject.Instantiate(TrafficLaneManager.crosswalkLine);
		} else {
			innerLine.renderer.enabled = true;
			outerLine.renderer.enabled = true;
		}
		updateCrosswalk();
	}
}

public function updateCrosswalk () {
	if (hasCrosswalk) {
		var diffV : Vector3 = otherSide.clockwiseNext.pivotPosition - mySide.pivotPosition;
		innerLine.transform.position = mySide.pivotPosition + diffV*0.5;
		innerLine.transform.rotation = Quaternion.LookRotation(diffV);
		innerLine.transform.localScale.z = diffV.magnitude / innerLine.GetComponent(MeshFilter).mesh.bounds.size.z;
		innerLine.transform.localScale.y = 0.017;
		outerLine.transform.position = mySide.pivotPosition + diffV*0.5 -
			(Mathf.Min(mySide.clockwisePrevious.getSidewalkWidth(), otherSide.clockwiseNext.getSidewalkWidth()) - 
			(outerLine.GetComponent(MeshFilter).mesh.bounds.size.x*outerLine.transform.localScale.x)/2)*
			(mySide.corner.transform.rotation*Vector3(0, 0, 1));
		outerLine.transform.rotation = Quaternion.LookRotation(diffV);
		outerLine.transform.localScale.z = diffV.magnitude / outerLine.GetComponent(MeshFilter).mesh.bounds.size.z;
		outerLine.transform.localScale.y = 0.017;
	}
}


// for debug use
function drawBounds (g : GameObject) {
	var p : Vector3[] = new Vector3[8];
	var e : Vector3 = g.transform.GetComponent(MeshFilter).mesh.bounds.extents;
	p[0] = new Vector3(e.x, e.y, e.z);
	p[1] = new Vector3(e.x, e.y, -e.z);
	p[2] = new Vector3(e.x, -e.y, e.z);
	p[3] = new Vector3(e.x, -e.y, -e.z);
	p[4] = new Vector3(-e.x, e.y, e.z);
	p[5] = new Vector3(-e.x, e.y, -e.z);
	p[6] = new Vector3(-e.x, -e.y, e.z);
	p[7] = new Vector3(-e.x, -e.y, -e.z);
	for (var i : int = 0; i < 8; i++) {
		p[i] = p[i] + g.transform.GetComponent(MeshFilter).mesh.bounds.center;
		p[i].x = p[i].x * g.transform.localScale.x;
		p[i].y = p[i].y * g.transform.localScale.y;
		p[i].z = p[i].z * g.transform.localScale.z;
		p[i] = g.transform.rotation * p[i];
		p[i] = p[i] + g.transform.position;
	}
	Debug.DrawLine(p[0], p[1], Color.red);
	Debug.DrawLine(p[0], p[2], Color.green);
	Debug.DrawLine(p[0], p[4], Color.blue);
}
