#pragma strict

/*-------------------------------------------------------------------------------------------*/
//	
//	requirements:
//	-	create a new layer named "Preview Layer"
//	-	set the PREVIEW_LAYER variable to be the number of the layer
//	-	drag "Preview Cam" prefab to the scene (should be in the "Scene Prefabs" folder)
//	-	uncheck "Preview Layer" from all the other Cameras' Culling Mask
//	-	make sure RotateObject.js is in the asset library
//	
//	usage:
//		-	Attach this script to an object
//		-	Call enablePreview() of this script instance to enable preview
//		-	Call showPreviewObject(rect, obj) of this scipt instance and pass in ...
//			~	rect : Rect (where you want the preview object to be)
//			~	obj : GameObject (GameObject you would like it to show)
//		-	Call disablePreview() when you are done
//	
/*-------------------------------------------------------------------------------------------*/

private var PREVIEW_DEPTH : float = 0.5;//1.0;	// in metres
private var PREVIEW_LAYER : int = 31;		// coressponding index of "Preview Layer" in layer manager
static var SCRIPT_HOST : String = "Preview Cam";

private var previewCamera : Camera;			// camera for previewing object
private var currentPreview : GameObject;	// current preview object
private var previousObject : GameObject;	// previous preview object (actual GameObject passed in)
private var allowShow : boolean;			// enables/disables preview
private var previewRect : Rect;				// rectangle bounds on screen for preview

function Start () {
	previewCamera = GameObject.Find(SCRIPT_HOST).camera;
	allowShow = false;
	var guiBackgroundCamera : GameObject = GameObject.Find("/Preview Cam/Background Camera/Background Image");
	guiBackgroundCamera.guiTexture.enabled = false;
}

function Update () {
	var guiBackgroundCamera : GameObject = GameObject.Find("/Preview Cam/Background Camera/Background Image");
	guiBackgroundCamera.guiTexture.pixelInset.width = 300;
	guiBackgroundCamera.guiTexture.pixelInset.height = 175;
	guiBackgroundCamera.guiTexture.pixelInset.x = -(Screen.width/2 - 15 - 30); // = -570
	guiBackgroundCamera.guiTexture.pixelInset.y = (Screen.height/2 - 15 - 50 - 40 - 175); // = 104
}

public function showPreviewObject (rect : Rect, obj : GameObject) {	// should not be called too frequently on different GameObjects (obj)
																	// because it instantiates a new one and destroys old one when a different
																	// GameObject (obj) is passed in
	if (allowShow && previousObject != obj && obj != null) {	// instantiate new one if a new GameObject is passed in
		if (currentPreview != null) Destroy(currentPreview);	// destroy old
		GameObject.Find("/Preview Cam/Background Camera/Background Image").guiTexture.enabled = true;
		instantiateObject(obj);	// instantiate new GameObject and configure it
		previousObject = obj;	// update previousObject (points to the passed in GameObject, NOT the new one just instantiated)
		setPreviewRect(rect);	// set previewRect to be rect
		repositionCurrent();	// position and scale the newly instantiated GameObject
		currentPreview.AddComponent(RotateObject);
	} else if (rect != previewRect) {	// if user(of this script) would like to update the previewRect while showing the same GameObject
										// ie different Rect (rect), same GameObject (obj)
		setPreviewRect(rect);
		repositionCurrent();
		GameObject.Find("/Preview Cam/Background Camera/Background Image").guiTexture.enabled = false;
	}
}

private function instantiateObject (obj : GameObject) {
	currentPreview = Instantiate(obj);
	currentPreview.transform.parent = previewCamera.gameObject.transform;
	for (var tempT : Object in currentPreview.transform) {
		(tempT as Transform).gameObject.layer = PREVIEW_LAYER;
	}
	currentPreview.layer = PREVIEW_LAYER;
}

private function setPreviewRect (rect : Rect) {
	previewRect = rect;
}

private function repositionCurrent () {
	previewCamera.rect = Rect(0, 0, 1, 1);
	var resizeRatio : float = resizeRatio();
	currentPreview.transform.localScale *= resizeRatio;
	currentPreview.transform.position = objectPosition();
	
	var Rs : Component[];
	var B : Bounds;
	Rs = currentPreview.GetComponentsInChildren(MeshRenderer);
	B = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	for (var j : int = 1; j < Rs.Length; j++) {
		B.Encapsulate((Rs[j] as MeshRenderer).bounds);
	}
	
	currentPreview.transform.position += currentPreview.transform.position - B.center;
	//currentPreview.transform.LookAt(previewCamera.gameObject.transform);
	previewCamera.rect = Rect(previewRect.x/Screen.width, (Screen.height-previewRect.y-previewRect.height)/Screen.height,
							previewRect.width/Screen.width, previewRect.height/Screen.height);
}

private function objectHeight () {
	var Rs : Component[];
	var B : Bounds;
	Rs = currentPreview.GetComponentsInChildren(MeshRenderer);
	B = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	for (var j : int = 1; j < Rs.Length; j++) {
		B.Encapsulate((Rs[j] as MeshRenderer).bounds);
	}
	var s : Vector3 = B.size;
	return s.y;
}

private function objectWidth () {
	var Rs : Component[];
	var B : Bounds;
	Rs = currentPreview.GetComponentsInChildren(MeshRenderer);
	B = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	for (var j : int = 1; j < Rs.Length; j++) {
		B.Encapsulate((Rs[j] as MeshRenderer).bounds);
	}
	var e : Vector3 = B.extents;
	return Mathf.Max(Vector3.Distance(Vector3(-e.x, 0, -e.z), Vector3(e.x, 0, e.z)),
		Vector3.Distance(Vector3(e.x, 0, -e.z), Vector3(-e.x, 0, e.z)));
}

private function resizeRatio () {
	var objWidth : float = objectWidth();
	var objHeight : float = objectHeight();
	var rBL : Ray = previewCamera.ViewportPointToRay(Vector3(0, 0, 0));	// bottom left
	var rTL : Ray = previewCamera.ViewportPointToRay(Vector3(0, 1, 0));	// top left
	var rTR : Ray = previewCamera.ViewportPointToRay(Vector3(1, 1, 0));	// top right
	var rBR : Ray = previewCamera.ViewportPointToRay(Vector3(1, 0, 0));	// bottom right
	var restrictWidth : float = PREVIEW_DEPTH*Mathf.Min((rTL.direction-rTR.direction).magnitude, (rBL.direction-rBR.direction).magnitude);
	var restrictHeight : float = PREVIEW_DEPTH*Mathf.Min((rTL.direction-rBL.direction).magnitude, (rTR.direction-rBR.direction).magnitude);
	return Mathf.Min(restrictWidth/objWidth, restrictHeight/objHeight);
}

private function objectPosition () {
	var rCenter : Ray = previewCamera.ViewportPointToRay(Vector3(0.5, 0.5, 0));	// center
	return rCenter.origin+PREVIEW_DEPTH*rCenter.direction;
}

public function enablePreview () {
	allowShow = true;
}

public function disablePreview () {
	allowShow = false;
	GameObject.Find("/Preview Cam/Background Camera/Background Image").guiTexture.enabled = false;
	previousObject = null;
	if (currentPreview != null) {
		Destroy(currentPreview);
	}
}

// for debug use
private function drawRect () {
	var r1 : Ray = previewCamera.ViewportPointToRay(Vector3(0, 0, 0));	// bottom left
	var r2 : Ray = previewCamera.ViewportPointToRay(Vector3(0, 1, 0));	// top left
	var r3 : Ray = previewCamera.ViewportPointToRay(Vector3(1, 1, 0));	// top right
	var r4 : Ray = previewCamera.ViewportPointToRay(Vector3(1, 0, 0));	// bottom right
	var rCenter : Ray = previewCamera.ViewportPointToRay(Vector3(0.5, 0.5, 0));	// center
    Debug.DrawLine(r1.origin+r1.direction*5, r2.origin+r2.direction*5, Color.yellow);
    Debug.DrawLine(r2.origin+r2.direction*5, r3.origin+r3.direction*5, Color.yellow);
    Debug.DrawLine(r3.origin+r3.direction*5, r4.origin+r4.direction*5, Color.yellow);
    Debug.DrawLine(r4.origin+r4.direction*5, r1.origin+r1.direction*5, Color.yellow);
    Debug.DrawLine(rCenter.origin, rCenter.origin+PREVIEW_DEPTH*rCenter.direction, Color.yellow);
    /*Debug.DrawLine(r1.origin, r2.origin+r2.direction*5, Color.yellow);
    Debug.DrawLine(r1.origin, r3.origin+r3.direction*5, Color.yellow);
    Debug.DrawLine(r1.origin, r4.origin+r4.direction*5, Color.yellow);
    Debug.DrawLine(r1.origin, r1.origin+r1.direction*5, Color.yellow);*/
}