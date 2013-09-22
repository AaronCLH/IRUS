/*----------------------------------------------------------------------------------------------------------*/
// Generic Object Script
//
// This script is the third and lowest level of the urban design hierarchy. This is attached to all instantiated
// urban design furniture, and it controls generic functions that could be needed for any piece of street furtniture.
// This script contains a reference to the parent SubGroup object, and also a reference to UIControl so that it
// can open the Movement and Rotation UIs
//
/*----------------------------------------------------------------------------------------------------------*/

#pragma strict

private var mySubGroup : SubGroup;  // Reference to parent SubGroup object
private var uiAccessor : UIControl; // Reference to UIControl
private var streetFurnitureUI : StreetFurnitureUI;
private var objectSelected : Boolean;
private var objectArrayIndex : int;

function Awake() {
	objectSelected = false;
	streetFurnitureUI = GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI);
}

function Start() {
	mySubGroup = transform.parent.GetComponent(SubGroup);
	uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);
}

function OnMouseDown() {
	//Debug.Log("GenericObject log : " + gameObject.tag + " -> " + gameObject.name.Replace("(Clone)",""));
	if(streetFurnitureUI.streetFurnitureOn && !streetFurnitureUI.undoButtonActive && !streetFurnitureUI.restoreDefaultActive) {
		SelectOrDeselectObject();
		streetFurnitureUI.ObjArrayRegistered();
	}
}

// This is the most important function in this script. The purpose is to instantiate an inputted GameObject obj at a certain position pos,
// and to make it a child of the inputted SubGroup GameObject subGroupGO. It also adds a collider in the appropriate location.
static function CreateObject (obj : GameObject, pos : Vector3, subGroupGO : GameObject) {
	var tempObj : GameObject = Instantiate(obj, Vector3.zero, Quaternion.identity); // Instantiates obj at the default position
	
	/* adds colliders */
	var Ms : Component[] = tempObj.GetComponentsInChildren(MeshFilter);
	for (var i : int = 0; i < Ms.Length; i++) {
		if (Ms[i].gameObject.GetComponent(Collider) == null) Ms[i].gameObject.AddComponent(MeshCollider);
	}
	
	var tempV : Vector3;
	var Rs : Component[] = tempObj.GetComponentsInChildren(MeshRenderer);
	var B : Bounds = (Rs[0] as MeshRenderer).bounds;	// should have at least 1 renderer
	/* grows the bounds to find the centre of the object including the children */
	for (i = 1; i < Rs.Length; i++) {
		B.Encapsulate((Rs[i] as MeshRenderer).bounds);
	}
	
	tempV = pos + tempObj.transform.position - B.center;
	tempV.y += B.extents.y;
	
	tempObj.transform.position = tempV;
	tempObj.AddComponent(GenericObject);
	tempObj.transform.parent = subGroupGO.transform; // Makes tempObj the child of the inputted subGroup
	subGroupGO.GetComponent(SubGroup).incNumObjects(); // Increases the number of objects in the subgroup
	return tempObj;
}

// Rotates the object using the Rotation UI
public function rotateMe () {
	RotationUI.UpdateObj = gameObject; // Sends the UI an object to rotate
	uiAccessor.openUI(UI.Rotation);
}

// Deletes the object from the scene
public function deleteMe () {
	mySubGroup.decNumObjects(); // Reduces numObjects in SubGroup by 1
	Destroy(gameObject);
}

// Replaces the GameObject that this script is attached to with obj. The heirarchy needs to be carefully adjusted.
public function replaceMe (obj : GameObject) {
	if (mySubGroup.getSpecies() == obj.name) { // In the case the user wants to replace the object with the same object.
											   // I don't know why they would but we give them the option anyways because it's easy to do.
		replaceHelp(obj, gameObject.transform.parent.gameObject);
		return void;
	}
	var parentGroup : Group = mySubGroup.getGroup();
	var newSubGroup : SubGroup = parentGroup.checkSubGroups(obj.name);
	if (newSubGroup == null) { // If there is no subgroup for the inputted species, this makes one and uses it as an argument for replaceHelp
		replaceHelp(obj, parentGroup.makeSubGroup(obj.name, obj.tag));
	} else { // If there is a subgroup, then just send the gameObject related to the subgroup to replaceHelp
		replaceHelp(obj, newSubGroup.gameObject);
	}
}

// This function is just a helper function for replaceMe. It creates an object in the location of the GameObject associated with this script,
// with the parent SubGroup of that object being the inputted subGroupObj. It also deletes the GameObject associated with this script.
private function replaceHelp (obj : GameObject, subGroupObj : GameObject) {
	CreateObject(obj, gameObject.transform.localPosition, subGroupObj);
	deleteMe();
}

/*
	We use the ToString function to return the more precise floating point value.
*/
public function ReturnObjectDetails () {
	var preciseLocalPosition : String = "(" + gameObject.transform.localPosition.x.ToString() + "," + gameObject.transform.localPosition.y.ToString()
		+ "," + gameObject.transform.localPosition.z.ToString() + ")";
	/*var preciseRotation : String = "(" + gameObject.transform.rotation.w.ToString() + "," + gameObject.transform.rotation.x.ToString() + ","
		+ gameObject.transform.rotation.y.ToString() + "," + gameObject.transform.rotation.z.ToString() + ")";*/
	var preciseEulerAngles : String = "(" + gameObject.transform.rotation.eulerAngles.x.ToString() + "," + gameObject.transform.rotation.eulerAngles.y.ToString()
		+ "," + gameObject.transform.rotation.eulerAngles.z.ToString() + ")";
	var preciseLocalScale : String = "(" + gameObject.transform.localScale.x.ToString() + "," + gameObject.transform.localScale.y.ToString()
		+ "," + gameObject.transform.localScale.z.ToString() + ")";
	var preciseLossyScale : String = "(" + gameObject.transform.lossyScale.x.ToString() + "," + gameObject.transform.lossyScale.y.ToString()
		+ "," + gameObject.transform.lossyScale.z.ToString() + ")";
	//var tempV : Vector3 = Vector3.Scale(DataParse.StringToVector3(preciseLocalScale), Vector3(1/transform.parent.localScale.x,1/transform.parent.localScale.y,1/transform.parent.localScale.z));
	//var preciseRelativeScale : String = "(" + tempV.x.ToString() + "," + tempV.y.ToString() + "," + tempV.z.ToString() + ")";
	return (preciseLocalPosition) + "&" + (preciseEulerAngles) + "&" + (preciseLocalScale);
}

public function RegisterChangesToParentGroup () {
	var group : Group = transform.parent.parent.gameObject.GetComponent(Group);
	group.RegisterChangesToUI();
	group.UpdateUnredoList();
}

public function SelectOrDeselectObject() {
	if(!objectSelected) {
		gameObject.AddComponent(GhostSelectedObjects);
		gameObject.GetComponent(GhostSelectedObjects).ghost();
		streetFurnitureUI.objArray.Push(gameObject);
		objectArrayIndex = streetFurnitureUI.objArray.length - 1;
		streetFurnitureUI.lastSelectedObj = gameObject;
		streetFurnitureUI.lastSelectedObjName = mySubGroup.getSpecies();
		objectSelected = true;
	} else {
		DeselectObject();
		streetFurnitureUI.objArray.RemoveAt(objectArrayIndex);
		for(var i = objectArrayIndex; i < streetFurnitureUI.objArray.length; i++) {
			(streetFurnitureUI.objArray[i] as GameObject).GetComponent(GenericObject).RefreshObjectArrayIndex(i);
		}
		if(streetFurnitureUI.objArray.length > 0) {
			streetFurnitureUI.lastSelectedObj = streetFurnitureUI.objArray[streetFurnitureUI.objArray.length - 1] as GameObject;
			streetFurnitureUI.lastSelectedObjName = (streetFurnitureUI.objArray[streetFurnitureUI.objArray.length - 1] as GameObject).transform.parent.gameObject.GetComponent(SubGroup).getSpecies();
		}
		//Debug.Log("GenericObject log : objArray.Length = " + streetFurnitureUI.objArray.length);
		/*for(i = 0; i < streetFurnitureUI.objArray.length; i++) {
			Debug.Log("GenericObject log : objArray["+i+"] index = " + (streetFurnitureUI.objArray[i] as GameObject).GetComponent(GenericObject).ReturnObjectArrayIndex());
		}*/
	}
}

public function DeselectObject() {
	gameObject.GetComponent(GhostSelectedObjects).showFull();
	UnityEngine.Object.Destroy(gameObject.GetComponent(GhostSelectedObjects));
	objectSelected = false;
}

public function ObjectSelected() {
	return objectSelected;
}

public function RefreshObjectArrayIndex(index : int) {
	objectArrayIndex = index;
}

public function ReturnObjectArrayIndex() {
	return objectArrayIndex;
}






