	/*-------------------------------------------------------------------------------------------*/
// Group Script
// 
// This script represents the top level of the urban design object instantiation hierarchy. These
// scripts are assigned to sidewalk prefab objects to control those subgroup game objects which are 
// children of the sidewalk prefabs. The subgroup objects are created, if there is not already a 
// subgroup of the same name, when objects are instantiated on the sidewalk.
//
// Objects are created if AllowSpawn is true whenever the sidewalk holding this script is selected
// by the mouse. 
//
/*-------------------------------------------------------------------------------------------*/

#pragma strict

static var SelectedGameObject : GameObject; // The object to instantiate. Updated in StreetFurnitureUI
static var NumObjects : int = 2; 			// The number of objects to instantiate. Updated in StreetFurnitureUI
static var AllowSpawn : boolean = false;	// If true, objects are allowed to be instantiated

private var wardNumber : String;
public var unityName : String;

private var INITIAL_GROUP_SIZE : int = 12; 	// Dummy number of subgroups to start out with
private var childGroups : SubGroup[]; 		// Array of subgroup objects that are attached to children of groupEmptyObject. Initially null.
private var groupEmptyObject : GameObject; 	// The empty GameObject that is created as a parent object for the subgroup GameObjects.
private var numChildren : int = 0; 			// The number of subgroups associated with this group.
private var uiAccessor : UIControl;
private var range: int = 50;
private var clickPosition : Vector3;
private var selectedSidewalk: GameObject;

public var changesMade : Boolean = false;

// Undo related variables
private var numRowsOfUnredoList : int = -1;	// -1 to extract the entire list
private var unredoPointer : int;
private var unredoList : String[];

function Awake () {
	childGroups = new SubGroup[INITIAL_GROUP_SIZE];
	unityName = transform.parent.gameObject.name; 
	wardNumber = gameObject.transform.parent.parent.gameObject.GetComponent(CreateAllRoads).WardNumber;
}

function Start () {
	UpdateUnredoList();
}

// This function is called whenever the sidewalk GameObject that this script is attached to is clicked on.
function OnMouseDown () {
	if (AllowSpawn) { // If you are allowed to spawn objects, create a group GameObject for parenting purposes, and then spawn
					  // the desired objects if there is an object selected.
		var streetFurnitureUI : StreetFurnitureUI = GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI);
		if (SelectedGameObject != null && !streetFurnitureUI.undoButtonActive && !streetFurnitureUI.restoreDefaultActive && !streetFurnitureUI.EditUIEnabled()) {
			if(NumObjects == 1) {
				var hit : RaycastHit;
				if (Physics.Raycast(Camera.main.ScreenPointToRay(Input.mousePosition), hit)) {
					clickPosition = hit.point;
				}
			}
			makeObjects(SelectedGameObject);
			RegisterChangesToUI();
			UpdateUnredoList();
		} else if (streetFurnitureUI.undoButtonActive) {
			//Debug.Log("Group log : Undo sidewalk objects");
			if(unredoList != null && unredoPointer >= 0) {
				if(streetFurnitureUI.UndoSidewalk(unityName + "~" + gameObject.name,unredoList[unredoPointer])) {
					yield WaitForSeconds(0.00001);
					RegisterChangesToUI();
				}
				unredoPointer--;
			} else if(unredoList != null) {
				/*if(streetFurnitureUI.RestoreSidewalkDefault(unityName + "~" + gameObject.name, wardNumber)) {
					RegisterChangesToUI();
				}*/
			}
		} else if (streetFurnitureUI.restoreDefaultActive) {
			//Debug.Log("Group log : Restore sidewalk objects");
			if(streetFurnitureUI.RestoreSidewalkDefault(unityName + "~" + gameObject.name, wardNumber)) {
				yield WaitForSeconds(0.00001);
				RegisterChangesToUI();
				UpdateUnredoList();
			}
		}
	} else {
		//UpdateLocalChanges();
		//gameObject.Find("DataHandler").GetComponent(UserDataBackend).AddUrbanDesignObjectChanges(unityName + "~" + gameObject.name);
	}
}

// This function basically holds an entire routine for object creation. It takes in a GameObject to instantiate, and places NumObjects of them 
// on the selected sidewalk (the Game Object that this script is attached to). It maintains the hierarchial structure outlined in the documentation.
// If there are already objects of a certain Species on this sidewalk, and the user wants to instantiate more, or less, of them on the sidewalk,
// this function just deletes the objects that are there in the subgroup and creates new ones.
private function makeObjects(obj : GameObject) {
	var objName : String = obj.name; 
	var subGroupObj : GameObject;
	var subGroup : SubGroup = checkSubGroups(objName);
	if (subGroup == null) { // If there is no subgroup with this name in the childGroups array, make the subgroup, and then place objects accordingly.	
		subGroupObj = makeSubGroup(objName, obj.tag);
		var tempArray: GameObject[] = gameObject.FindGameObjectsWithTag("LatestAdded");
		for (var gm: GameObject in tempArray){
			gm.tag = "SubgroupObj";
		}
		subGroupObj.tag = "LatestAdded";
		var tempArray2: GameObject[] = gameObject.FindGameObjectsWithTag("Selected");
		for ( var gm2: GameObject in tempArray2){
			gm2.tag = "InsertedObjects";
			//SetTagForAllChildren(gm2, "InsertedObjectChildren");
		}
		for (var child:Transform in subGroupObj.transform/* as Transform[]*/){
			child.gameObject.tag = "Selected";
			//SetTagForAllChildren(child.gameObject, "InsertedObjectChildren");
		}
		placeObject(obj, subGroupObj);
	} else if (subGroup.isEmpty()) { // If the subgroup is there, but empty, place the object.
		placeObject(obj, subGroup.gameObject);				 	
	} else { // Being here implies that there is a non-empty subgroup already there of this name. In this case, we will delete all of the old
			 // objects, and just instantiate new ones, as noted above.
		if(NumObjects != 1) subGroup.deleteAll();
		//else Debug.Log("Group log : adding 1 generic object into " + subGroup.gameObject.name);
		placeObject(obj, subGroup.gameObject);
	}		
} 
	
// This function handles the creation of subgroup objects that are not already children of this group. Helper function for makeObjects. Takes in
// the species name of the object objName, and the type name of the object objTag, and produces a subgroup GameObject.
public function makeSubGroup(objName : String, objTag : String) : GameObject { // Need to declare the type of the function to avoid cyclical referencing
	var subGroupObj : GameObject;
	var newSubGroup : SubGroup;
	subGroupObj = new GameObject(/*"SubGroup_" + */objName); // The subgroup GameObject is named according to the species.
	subGroupObj.transform.position = gameObject.transform.position;
	subGroupObj.transform.rotation = gameObject.transform.rotation;
	subGroupObj.transform.parent = gameObject.transform; //groupEmptyObject.transform;
	subGroupObj.transform.localPosition = Vector3.zero; 		// The position and rotation of the subgroup GameObject will be the same as the parent 
	subGroupObj.transform.localRotation = Quaternion.identity;  // group GameObject.
	newSubGroup = subGroupObj.AddComponent(SubGroup); 
	newSubGroup.initializeSubGroup(objName, objTag, this); // This is like a constructor function for the subgroup class. It gives the species name, the
														   // type name, and this instance of the group script.
	
	numChildren++;
	if (numChildren > childGroups.length) { // This is used to resize the built-in array childGroups in the case that there are more than 
											// INITIAL_GROUP_SIZE subgroups. Resizes it to twice the original size.
		var tempLength : int = childGroups.length;			
		var tempArray : SubGroup[] = new SubGroup[tempLength];
		System.Array.Copy(childGroups, tempArray, tempLength);
		childGroups = new SubGroup[2*tempLength];
		System.Array.Copy(tempArray, childGroups, tempLength);
	}
	childGroups[numChildren-1] = newSubGroup;
	
	return subGroupObj;	
}

// This function checks whether or not there is a subgroup with the given species name. If there is, return the subgroup.
// If not, return null. Helper function for makeSubGroup. Also used in GenericObject to replace objects.
public function checkSubGroups(speciesName : String) {
	for (var i : int = 0; i < numChildren; i++){ // Loops through childGroups to find if there is a matching subgroup name.
		if (childGroups[i].getSpecies() == speciesName) {			
			return childGroups[i];
		}
	}
	return null;
}	

// This function places a number of prefab GameObjects, where the prefab is obj, in the subgroup associated with subGroupObj.
// It uses the GenericObject function CreateObject to actually instantiate the objects as a helper function.	
private function placeObject (obj : GameObject, subGroupObj : GameObject) {
	//var b : Bounds = gameObject.transform.Find("Mesh1").GetComponent(MeshFilter).mesh.bounds;	// Finds the local bounds of the sidewalk object.
	var b : Bounds = gameObject.GetComponent(MeshFilter).mesh.bounds;
																					// Uses the fact that the mesh for the sidewalk prefabs is called "Mesh1".
	//Debug.Log("x: " + b.extents.x + " y: " + b.extents.y + " z: " + b.extents.z);																		
	if(NumObjects != 1) {
		var startV : Vector3;
		var endV : Vector3;
		//startV = b.center + Vector3(-b.extents.x, b.extents.y, 0);
		//endV = b.center + Vector3(b.extents.x, b.extents.y, 0);
		startV = b.center + Vector3(0, b.extents.y, -b.extents.z);
		endV = b.center + Vector3(0, b.extents.y, b.extents.z);
		var increment : Vector3 = (endV - startV) / (NumObjects - 1);
		
		for (var i : int = 0; i < NumObjects; i++) {
			GenericObject.CreateObject(obj, gameObject.transform.TransformPoint(startV + i*increment), subGroupObj);
		}
	} else if(NumObjects == 1) {
		GenericObject.CreateObject(obj, clickPosition, subGroupObj);
	}
}

public function ReturnObjectsInfoOnSidewalk () {
	var infoString : String;
	var notFirstSpecies : Boolean = false;
	for (var child : Transform in gameObject.transform/* as Transform[]*/) {
		if(notFirstSpecies) infoString += ";";
		var preciseScaleString : String = "(" + child.localScale.x.ToString() + "," + child.localScale.y.ToString() + "," + child.localScale.z.ToString() + ")";
		var preciseLossyScale : String = "(" + child.lossyScale.x.ToString() + "," + child.lossyScale.y.ToString() + "," + child.lossyScale.z.ToString() + ")";
		//var tempV : Vector3 = Vector3.Scale(DataParse.StringToVector3(preciseScaleString), Vector3(1/gameObject.transform.localScale.x,1/gameObject.transform.localScale.y,1/gameObject.transform.localScale.z));
		//preciseScaleString = "(" + tempV.x.ToString() + "," + tempV.y.ToString() + "," + tempV.z.ToString() + ")";
		infoString += child.gameObject.name + "_" + child.gameObject.GetComponent(SubGroup).getType() + "_" + preciseScaleString + ":";
		infoString += child.gameObject.GetComponent(SubGroup).ReturnChildrenObjectsInfo();
		notFirstSpecies = true;
	}
	return infoString;
}

public function RegisterChangesToUI () {
	UpdateLocalChanges();
	// Here, we ensure that we only register the StreetFurnitureUI once
	if(!changesMade) {
		GameObject.Find("UI Handler").GetComponent(StreetFurnitureUI).RegisterUnityNameToChangeList(unityName + "~" + gameObject.name);
		changesMade = true;
	}
}

private function UpdateLocalChanges () {
	var infoString : String = ReturnObjectsInfoOnSidewalk();
	//Debug.Log("Group log : infoString = " + infoString);;
	if(infoString != null) {
		gameObject.Find("DataHandler").GetComponent(UserDataBackend).UrbanDesignLocalizedChangeListUpdate(unityName + "~" + gameObject.name,infoString);
	}
}

public function UpdateUnredoList () {
	unredoList = GameObject.Find("DataHandler").GetComponent(UserDataBackend).ReturnListOfPreviousUrbanDesignChanges(unityName + "~" + gameObject.name, numRowsOfUnredoList);
	if(unredoList != null) {
		unredoPointer = unredoList.length - 2;
	} else {
		//Debug.Log("Group log : unredoList is null");
	}
}

public function PopulateUserObjects (dataString : String) {
	if(dataString == null) return false;
	var objectElements : String[] = dataString.Split(";"[0]);

	for(var element in objectElements) {
		var data : String[] = element.Split(":"[0]);
		var typeInfo : String[] = data[0].Split("_"[0]);
		var species : String = typeInfo[0];
		var type : String = typeInfo[1];
		var typeScale : Vector3 = DataParse.StringToVector3(typeInfo[2]);
		if(data[1].length < 1) continue; // Empty Subgroup eg. the string would be like "Trees_Vegetation_():"

		var objectsInfo : String[] = data[1].Split("_"[0]);
		var subGroupObj : GameObject = new GameObject(species);
		subGroupObj.transform.parent = gameObject.transform;
		subGroupObj.transform.localPosition = Vector3.zero;
		subGroupObj.transform.localRotation = Quaternion(0,0,0,0);
		subGroupObj.transform.localScale = typeScale;
		
		var subGroup = subGroupObj.AddComponent(SubGroup);
		subGroupObj.tag = "SubgroupObj";
		subGroup.initializeSubGroup(species,type,this);
		// To accommodate their subgroup "convention"
		numChildren++;
		if (numChildren > childGroups.length) { // This is used to resize the built-in array childGroups in the case that there are more than 
												// INITIAL_GROUP_SIZE subgroups. Resizes it to twice the original size.		
			var tempArray : SubGroup[] = new SubGroup[2*childGroups.length];
			System.Array.Copy(childGroups, tempArray, childGroups.length);
			childGroups = null;
			childGroups = tempArray;
		}
		childGroups[numChildren-1] = subGroup;
		for(var object in objectsInfo) {
			subGroup.incNumObjects();
			var info : String[] = object.Split("&"[0]);
			var newObject : GameObject = Instantiate(ObjectLibrary.TypeList[ObjectLibrary.ReturnTypeIndex(type)].getSpeciesPrefabByName(species),DataParse.StringToVector3(info[0]),Quaternion.identity);
			newObject.transform.parent = subGroup.transform;
			newObject.transform.localPosition = DataParse.StringToVector3(info[0]);
			newObject.transform.rotation = Quaternion.Euler(DataParse.StringToVector3(info[1]));
			newObject.transform.localScale = DataParse.StringToVector3(info[2]);
			newObject.AddComponent(GenericObject);
		}
	}
	return true;
}

public function ReturnWardNumber() {
	return wardNumber;
}

public function ChangesUnmade() {
	changesMade = false;
}








