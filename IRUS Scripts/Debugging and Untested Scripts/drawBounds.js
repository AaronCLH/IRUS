#pragma strict
private var center : Vector3;
private var left : Vector3;
private var right : Vector3;
private var myPosition : Vector3;

private var fourSides : Vector3[];
private var ray : Ray;

private var c : Vector2;
private var l : Vector2;

class infoSet {
	var worldPoint : Vector3;
	var viewportPoint : Vector3;
	var reducedScreenPoint : Vector3;
	var inView : boolean;
	var left : infoSet;
	var right : infoSet;
	function setWorldPoint (v : Vector3) {
		worldPoint = v;
		viewportPoint = Camera.main.WorldToViewportPoint(v);
		reducedScreenPoint.x = Mathf.Max(0, viewportPoint.x);
		reducedScreenPoint.x = Mathf.Min(viewportPoint.x, 1);
		reducedScreenPoint.y = Mathf.Max(0, viewportPoint.y);
		reducedScreenPoint.y = Mathf.Min(viewportPoint.y, 1);
		reducedScreenPoint.x = Screen.width*viewportPoint.x;
		reducedScreenPoint.y = Screen.height*viewportPoint.y;
	}
	function setLeft (i : infoSet) {
		left = i;
	}
	function setRight (i : infoSet) {
		right = i;
	}
}

function Update () {
	var e : Vector3 = gameObject.GetComponent(Renderer).bounds.extents;
	var c : Vector3 = gameObject.GetComponent(Renderer).bounds.center;
	Debug.DrawLine((c+Vector3(-e.x, 0, -e.z)), (c+Vector3(-e.x, 0, e.z)), Color.red);
	Debug.DrawLine((c+Vector3(-e.x, 0, -e.z)), (c+Vector3(e.x, 0, -e.z)), Color.red);
	Debug.DrawLine((c+Vector3(e.x, 0, e.z)), (c+Vector3(-e.x, 0, e.z)), Color.red);
	Debug.DrawLine((c+Vector3(e.x, 0, e.z)), (c+Vector3(e.x, 0, -e.z)), Color.red);
	
	var fourPoints : Vector3[] = [c+Vector3(-e.x, 0, -e.z), c+Vector3(e.x, 0, -e.z), c+Vector3(e.x, 0, e.z), c+Vector3(-e.x, 0, e.z)];
	myPosition = Camera.main.transform.position;
	var closest : float = Mathf.Infinity;
	var indexOfClosest : int;
	for (var i : int = 0; i < 4; i++) {
		if ((fourPoints[i]-myPosition).magnitude < closest) {
			closest = (fourPoints[i]-myPosition).magnitude;
			indexOfClosest = i;
		}
	}
	center = fourPoints[indexOfClosest];
	left = fourPoints[(indexOfClosest+3)%4];
	right = fourPoints[(indexOfClosest+1)%4];
	Debug.DrawLine(center, left, Color.blue);
	Debug.DrawLine(center, right, Color.yellow);
	if (Input.GetKeyDown("f")) {
		ray = Camera.main.ScreenPointToRay(Input.mousePosition);
	}
	if (ray != null) {
		Debug.DrawRay(ray.origin, ray.direction, Color.red, 1000);
		Debug.DrawRay(ray.origin, -ray.direction, Color.blue, 1000);
	}
	Debug.DrawLine(Camera.main.transform.position, center, Color.blue);
	/*if (Vector3.Dot(center-myPosition, Camera.main.transform.forward) < 0) {
		//center = Camera.main.transform.position+Vector3.Reflect(center-Camera.main.transform.position, Vector3(Camera.main.transform.forward.x, 0, Camera.main.transform.forward.z));
		//center = Camera.main.transform.position+Vector3.Exclude(center-Camera.main.transform.position, Camera.main.transform.forward);
		center = center-Vector3.Project(center-Camera.main.transform.position, Camera.main.transform.forward)+Camera.main.transform.forward*Camera.main.nearClipPlane;
	}
	if (Vector3.Dot(left-myPosition, Camera.main.transform.forward) < 0) {
		//	left = Camera.main.transform.position+Vector3.Reflect(left-Camera.main.transform.position, Vector3(Camera.main.transform.forward.x, 0, Camera.main.transform.forward.z));
		left = left-Vector3.Project(left-Camera.main.transform.position, Camera.main.transform.forward)+Camera.main.transform.forward*Camera.main.nearClipPlane;
	}*/
	Debug.DrawRay(Camera.main.transform.position, Camera.main.transform.forward, Color.red);
	Debug.DrawLine(Camera.main.transform.position, center, Color.yellow);
}

function OnGUI () {
	if (center != null) {
		//var c : Vector3 = Camera.main.WorldToViewportPoint(center);
		//var l : Vector3 = Camera.main.WorldToViewportPoint(left);
		//var r : Vector3 = Camera.main.WorldToViewportPoint(right);
		//Debug.Log(c+" "+Vector3.Dot(center-myPosition, Camera.main.transform.forward));
		//GUI.Box(Rect(Mathf.Max(Mathf.Min(Camera.main.WorldToScreenPoint(left).x, Screen.width), 0),
		//	Screen.height-Mathf.Max(Mathf.Min(Camera.main.WorldToScreenPoint(left).y, Screen.height), 0), 5, 5), "");
		//GUI.Box(Rect(Camera.main.WorldToScreenPoint(center).x, 
		//	Screen.height-Camera.main.WorldToScreenPoint(center).y, 5, 5), "");
		//Debug.Log(Camera.main.WorldToScreenPoint(center));
		//GUI.Box(Rect(Camera.main.WorldToScreenPoint(left).x, 
		//	Screen.height-Camera.main.WorldToScreenPoint(left).y,
		//	Mathf.Abs(Camera.main.WorldToScreenPoint(center).x-Camera.main.WorldToScreenPoint(left).x),
		//	Mathf.Abs(Camera.main.WorldToScreenPoint(center).y-Camera.main.WorldToScreenPoint(left).y)), "");
		//Debug.Log(Mathf.Rad2Deg*Mathf.Atan2(c.y-l.y, c.x-l.x));
	c = Vector2(Camera.main.WorldToScreenPoint(center).x, Camera.main.WorldToScreenPoint(center).y);
	l = Vector2(Camera.main.WorldToScreenPoint(left).x, Camera.main.WorldToScreenPoint(left).y);
	if (Vector3.Dot(center-myPosition, Camera.main.transform.forward) < 0) {
		c.y -= Screen.height;
		c.x = Screen.width - c.x;
	}
	if (Vector3.Dot(left-myPosition, Camera.main.transform.forward) < 0) {
		l.y -= Screen.height;
		l.x = Screen.width - l.x;
	}
		GUIUtility.RotateAroundPivot(Mathf.Rad2Deg*Mathf.Atan2(l.y-c.y, c.x-l.x), Vector2(l.x, Screen.height-l.y));
		GUI.HorizontalSlider(Rect(l.x, Screen.height-l.y, Vector2.Distance(c, l), 10), 50, 0, 100);
		GUIUtility.RotateAroundPivot(Mathf.Rad2Deg*-Mathf.Atan2(l.y-c.y, c.x-l.x), Vector2(l.x, Screen.height-l.y));
		/*
		if (c.x < 1 && c.x > 0 && c.y < 1 && c.y > 0 && Vector3.Dot(center-myPosition, Camera.main.transform.forward) > 0) {
			GUI.Box(Rect(Camera.main.WorldToScreenPoint(left).x, Screen.height-Camera.main.WorldToScreenPoint(left).y,
				Mathf.Abs(Camera.main.WorldToScreenPoint(left).x-Camera.main.WorldToScreenPoint(center).x),
				Mathf.Abs(Camera.main.WorldToScreenPoint(left).y-Camera.main.WorldToScreenPoint(center).y)), "");
		}
		if (l.x < 1 && l.x > 0 && l.y < 1 && l.y > 0) {
			GUI.Box(Rect(Camera.main.WorldToScreenPoint(left).x, Screen.height-Camera.main.WorldToScreenPoint(left).y, 5, 5), "");
		}
		if (r.x < 1 && r.x > 0 && r.y < 1 && r.y > 0) {
			GUI.Box(Rect(Camera.main.WorldToScreenPoint(right).x, Screen.height-Camera.main.WorldToScreenPoint(right).y, 5, 5), "");
		}*/
	}
}