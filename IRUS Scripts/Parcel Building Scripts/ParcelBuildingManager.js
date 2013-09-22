// Parcel Building Manager - Controls raycast detection for parcels and buildings

#pragma strict

static var SCRIPT_HOST : String = "First Person Controller";	// The name of the GameObject holding this script
private var BUILDING_TYPE_NAME : String = "Building";			// The tag on each building
private var MOUSE_CAST_DISTANCE : float = 100.0;				// The length of the ray to cast
private var RAY_CAST_TIME_GAP : float = 0.2;					// The buffer in between ray casts

private var buildingType : Type;		// The Type object for a Building GameObject
private var hit : RaycastHit;			// Information regarding a RaycastHit
private var ray : Ray;					// The ray sent from the mouse
private var detectedParcel : Parcel;	// The parcel that has been hit by the raycast or the parcel that holds the building hit by the raycast
private var lastParcel : Parcel;		// The previous detectedParcel
private var allowDetection : boolean;	// Are raycasts allowed to detect parcels?
private var lastCastTime : float;		// The time that the previous ray was sent at

static var ParcelWallParent : GameObject;	// The GameObject that is the parent of the parcel wall prefabs

function Awake () {
	ParcelWallParent = GameObject.Find("Parcel Walls");
	allowDetection = false; // Initially do not allow detection
	buildingType = new Type(BUILDING_TYPE_NAME);
	lastCastTime = 0;
	
	var tempObjArray: Object [] = Resources.LoadAll("Buildings");
	for (var go: Object in tempObjArray){
		addBuildingModel((go as GameObject));
	}
	
}

function Update () {
	if (allowDetection && CursorLock.CameraLocked() && (Time.time-lastCastTime) > RAY_CAST_TIME_GAP) {
		// If the detection is allowed, the camera is locked, and the buffer time has passed since the last raycast, update
		// the time of the last raycast. Also if the raycast does not hit anything in the layer, set the detected parcel to null
		if (!mouseRayCast()) detectedParcel = null;
		lastCastTime = Time.time;
	}
}

// This function handles the actual raycast from the mouse
private function mouseRayCast () {
	ray = Camera.main.ScreenPointToRay(Input.mousePosition);
	
	// If the ray hits something in the RAYCAST_MASK_LAYER, check if it has hit a parcel or a building and return true.
	// Otherwise, return false
	if (Physics.Raycast(ray, hit, MOUSE_CAST_DISTANCE, 1<<Parcel.RAYCAST_MASK_LAYER)) {
		detectedParcel = hit.collider.gameObject.GetComponent(Parcel);
		if (detectedParcel == null) { // ray hit a building
			var b : GameObject = hit.collider.gameObject as GameObject;
			while (b.GetComponent(Building) == null) {
				b = b.transform.parent.gameObject;
			}
			detectedParcel = b.GetComponent(Building).getParcel();
		}
		return true;
	} else {
		return false;
	}
}

public function getDetectedParcel () {
	return detectedParcel;
}

// Allows raycast detection
public function enableDetection () {
	allowDetection = true;
	buildingType.removeEmptyNames();
}

public function disableDetection () {
	allowDetection = false;
}

public function getBuildingType () {
	return buildingType;
}

// Adds a building to the species library
public function addBuildingModel (g : GameObject) {
	buildingType.addSpecies(new Species(buildingType, g.name, g));
}