#pragma strict


/*-------------------------------------------------------------------------------------------*/
//	
//	Attach this script to a GameObject to add trigger (IS_TRIGGER) convex mesh collider
//	(CONVEX_COLLIDER) to each mesh filter in it (ADD_TO_PARENT) and its children, this can
//	also remove any exisitng colliders (REMOVE_EXISTING_COLLIDERS)
//	
//	*** IF MESH HAS > 255 POLYGONS, A WARNING WILL APPEAR
/*-------------------------------------------------------------------------------------------*/

private var IS_TRIGGER : boolean = false;				// These can, and should, be changed as desired
private var ADD_TO_PARENT : boolean = true;
private var REMOVE_EXISTING_COLLIDERS : boolean = true;
private var CONVEX_COLLIDER : boolean = false;

function Start () {
	if (ADD_TO_PARENT) {
		colliderToParentAndChildren(gameObject); // If you are adding to the parent as well, call the helper function on
												 // the gameObject associated with this script		
	} else {
		for (var go : Object in gameObject.transform) {
			if (REMOVE_EXISTING_COLLIDERS) {
				for (var tempCollider : Object in (go as Transform).gameObject.GetComponentsInChildren(Collider)) {
					DestroyImmediate((tempCollider as Component));
				}
			}
			colliderToParentAndChildren((go as Transform).gameObject);
		}
	}
}

// Helper function
private function colliderToParentAndChildren (go : GameObject) {
	var tempCollider : MeshCollider;
	for (var m : Component in go.GetComponentsInChildren(MeshFilter)) {
		if (m.gameObject.collider == null) {
			tempCollider = m.gameObject.AddComponent(MeshCollider);
			tempCollider.isTrigger = IS_TRIGGER;
			if (CONVEX_COLLIDER) {
				tempCollider.convex = true;
				if (m.gameObject.collider == null) {	// just in case set_convex fails and destroys collider
					tempCollider = m.gameObject.AddComponent(MeshCollider);
					tempCollider.isTrigger = IS_TRIGGER;
					tempCollider.convex = false;
				}
			}
		}
	}
}

