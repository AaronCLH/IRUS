// Building Script - Handles functionality directly related to a building GameObject.

#pragma strict

private var parcel : Parcel; // Reference to the parcel that this building is on

private var oldMaterials : Material_Array[];   // The default materials attached to the building
private var ghostMaterials : Material_Array[]; // The new materials that are attached when the building is ghosted (transparent)

// Simple class to hold materials
class Material_Array {
	public var materials : Material[];
}

private var ghosting : boolean = false;			// Is the building being shown as transparent?

static var GHOST_MATERIAL : Material = null;    // Material to use when the building is being ghosted

function Awake () {
	if (GHOST_MATERIAL == null) { // If no GHOST_MATERIAL, make it using the Transparent/Diffuse shader and with the inputted colour
		GHOST_MATERIAL = new Material(Shader.Find("Transparent/Diffuse"));
		GHOST_MATERIAL.color = Color(0, 1, 1, 0.4);
	}
	var Mr : Component[] = gameObject.GetComponentsInChildren(MeshRenderer); // All MeshRenderers in the children
	oldMaterials = new Material_Array[Mr.Length];
	ghostMaterials = new Material_Array[Mr.Length];
	for (var i : int = 0; i < oldMaterials.Length; i++) { // Create a new Material_Array for each material in the old materials
		oldMaterials[i] = new Material_Array();
		ghostMaterials[i] = new Material_Array();
	}
	for (i = 0; i < Mr.Length; i++) {
		oldMaterials[i].materials = (Mr[i] as MeshRenderer).materials; // Set the old materials to be the default materials
		ghostMaterials[i].materials = new Material[(Mr[i] as MeshRenderer).materials.Length];
		for (var j : int = 0; j < ghostMaterials[i].materials.Length; j++) {
			ghostMaterials[i].materials[j] = GHOST_MATERIAL; // Set each material in the ghostMaterials array to be the ghosted materials
		}
	}
}

function Start () {	// colliders may not be ready when script is attached, so do this in Start
	for (var c : Object in gameObject.GetComponentsInChildren(Collider)) {
		(c as Collider).gameObject.layer = Parcel.RAYCAST_MASK_LAYER;
	}
}

// This function sets the parcel associated with this building
public function occupyParcel (p : Parcel) {
	if (parcel != null) {
		parcel.freeParcel();
	}
	parcel = p;
}

// This function gets the parcel that this building sits on
public function getParcel () {
	return parcel;
}

// This function destroys this building
public function destroyBuilding () {
	parcel.freeParcel();
	Destroy(this.gameObject);
}

// This function gives the building a transparent effect
public function ghost() {
	if (!ghosting) {
		var Mr : Component[] = gameObject.GetComponentsInChildren(MeshRenderer);
		for (var i : int = 0; i < Mr.Length; i++) {
			(Mr[i] as MeshRenderer).materials = ghostMaterials[i].materials;
		}
	}
	ghosting = true;
}

// This function returns the default materials to the building
public function showFull() {
	if (ghosting) {
		var count : int = 0;
		var Mr : Component[] = gameObject.GetComponentsInChildren(MeshRenderer);
		for (var i : int = 0; i < Mr.Length; i++) {
			(Mr[i] as MeshRenderer).materials = oldMaterials[i].materials;
		}
	}
	ghosting = false;
}

// This function checks if the building is being shown as transparent
public function isGhosting () {
	return ghosting;
}