/*------------------------------------------------------------------------------------------------*/
// SubGroup Script - Treat this as a regular Class
//
// This script handles the grouping of similarly-typed GameObjects that are being instantiated. This
// is the second level of the urban design hierarchy outlined in the documentation. Functions that are 
// applied to all objects of a certain type on a certain sidewalk are stored here. Also, reference
// functions needed for the Group script are contained in here, like getSpecies() and getNumObjects().
//
// A reference to UIControl is needed in this script to open the movement and rotation UIs.
//
/*------------------------------------------------------------------------------------------------*/

#pragma strict

private var species : String; 		 // Species name of all Objects in this subgroup
private var type : String; 			 // Type name of all Objects in this subgroup
private var numObjects : int = 0; 	 // Number of objects in this subgroup. Initially set to zero
private var myGroup : Group; 		 // Reference to the parent Group
private var uiAccessor : UIControl;  // Reference to UIControl

function Start() {
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);
}

/*
function OnMouseDown() {
	Debug.Log("SubGroup");
}
*/

// "Constructor" for the subgroup. Gives it a species, type, and parent Group reference.
public function initializeSubGroup (sp : String, tp : String, grp : Group) {
	species = sp;
	type = tp;
	myGroup = grp;
}

// Checks if the subgroup has any objects in it.
public function isEmpty() {  
	return (numObjects == 0);
}

// Returns the species name.
public function getSpecies () {
	return species;
}

// Returns the number of objects in this subgroup.
public function getNumObjects () {
	return numObjects;
}

// Returns the type of the subgroup
public function getType () {
	return type;
}

// Returns the parent Group instance.
public function getGroup () {
	return myGroup;
}

// Increases the number of objects in this subgroup.
public function incNumObjects() {
	numObjects++;
}

// Decreases the number of objects in this subgroup.
public function decNumObjects () {
	numObjects--;
}

// Replaces all objects in the subgroup with the inputted object. Newly instantiated objects will likely not be a member of this subgroup.
public function replaceAll(obj : GameObject) {
	for (var child : Object in transform) {
		(child as Transform).gameObject.GetComponent(GenericObject).replaceMe(obj); // Use the replaceMe function in GenericObject 
																					// to handle replacing each object.
	}
}	

// Moves all the objects in this subgroup using the Movement UI.
public function moveAll() {
	var objs : Array;
	for (var child : Object in transform) {
		objs.Push((child as Transform).gameObject); // Adds each child object to an array.
	}
	var gameObjs : GameObject[] = new GameObject[objs.length];
	for (var i : int = 0; i < gameObjs.length; i++) {
		gameObjs[i] = (objs[i] as GameObject); // Converts the Array into a GameObject Array.
	}
	MovementUI.UpdateObjs = gameObjs; // Gives MovementUI some GameObjects to move.
	uiAccessor.openUI(UI.Movement); // Opens MovementUI.
}

// Rotates all the objects in this subgroup using the Rotation UI.
public function rotateAll () {
	var objs : Array;
	for (var child : Object in transform) {
		objs.Push((child as Transform).gameObject); // Adds each child object to an array.
	}
	var gameObjs : GameObject[] = new GameObject[objs.length];
	for (var i : int = 0; i < gameObjs.length; i++) {
		gameObjs[i] = (objs[i] as GameObject); // Converts the Array into a GameObject Array.
	}
	RotationUI.UpdateObjs = gameObjs; // Gives RotationUI some GameObjects to rotate.
	uiAccessor.openUI(UI.Rotation); // Opens RotationUI.
}

// Destroys all the objects in this subgroup
public function deleteAll () {
	for (var child : Object in transform) {
		(child as Transform).gameObject.GetComponent(GenericObject).deleteMe(); // Deletes each GameObject using the function inside GenericObject.
	}	
}

public function ReturnChildrenObjectsInfo () {
	var infoString : String;
	var notFirstObject : Boolean = false;
	for(var child : Transform in gameObject.transform) {
		if(notFirstObject) infoString += "_";
		infoString += child.gameObject.GetComponent(GenericObject).ReturnObjectDetails();
		notFirstObject = true;
	}
	return infoString;
}







