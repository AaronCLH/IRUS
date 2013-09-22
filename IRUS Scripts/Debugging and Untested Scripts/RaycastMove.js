#pragma strict

var go : GameObject;
static var curObj : GameObject;
private var uiAccessor : UIControl;

function Start () {
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);
}

function Update () {
	if (Input.GetButton("Fire1")) {
		var ray : Ray = Camera.main.ScreenPointToRay(Input.mousePosition);
		var hit : RaycastHit;
		var yAngle : float;		
		if (!curObj) {
			curObj = Instantiate(go);
			if (curObj.GetComponent(Collider)) curObj.collider.enabled = false;
			else curObj.GetComponentInChildren(Collider).enabled = false;
		}
		if (Physics.Raycast(transform.position, ray.direction, hit, 50)) {
			if (hit.collider.gameObject.GetComponent(TerrainCollider) || hit.collider.gameObject.tag == "sidewalk") {
				var mid : Vector3 = new Vector3();
				mid = curObj.GetComponentInChildren(Renderer).bounds.center;
				mid.y = curObj.transform.position.y;
				curObj.transform.position = hit.point + curObj.transform.position - mid;
				uiAccessor.openUI(UI.Rotation);
			}
		}
	}
}