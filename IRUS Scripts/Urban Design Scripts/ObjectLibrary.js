//////////////////////////////////////////////////////////////////////////////////////////////
// Object Library
//
// This script controls loading street furniture prefab assets into a static
// array TypeList that will be accessible throughout all scripts. TypeList is
// an array of Type objects, which contain all relevant information about the 
// objects. 
//
// There are two classes introduced here. One is Type, which groups the prefab library 
// into objects based on their category (Benches, Garbage Cans, Trees, etc.). The
// other class is Species, which goes a level deeper than Type, separating the types 
// into different objects based on the specific object that it is (Classic, Modern, Generic
// are examples of species that are all of type Benches).

// This Script provides the following Variables, Classes and Functions: 
//  Static Variables:
//     - static var TypeList : Type[];
//	   - static var TypeNames : String[];

//  Classes: 
//     - Type
//     - Species

//  Functions:
//     - loadGOToList (assetObj : GameObject) : void   If assetObj's tag matches a Type from the Typelist, then it is added as a species belonging to that Type, with the species' name as the objects name.  
//     - resizeTypeNames () : void
//     - getNumTypes() : int

#pragma strict

static var SCRIPT_HOST : String = "First Person Controller";

// Constant initialization size for the array (use builtin arrays for efficiency)
private var TYPELIST_INIT_SIZE : int = 12;

// Static arrays for accessing the type objects or just their names.
static var TypeList : Type[];
static var TypeNames : String[];

// Number of types in the library
private var numTypes : int;

// Type class contains all relevant information about a single type, including its
// name, an array of species objects that fall under it, an array of the names of
// those species, and the number of species in a specific Type.
public class Type {
	private var typeName : String;
	private var speciesList : Species[];
	private var speciesNames : String[];
	private var numSpecies : int;
	function Type (tn : String) {
		typeName = tn;
		speciesList = new Species[8];
		speciesNames = new String[8];
		numSpecies = 0;
	}
	public function getName () {
		return typeName;
	}
	public function getSpecies (ind : int) {
		return speciesList[ind];
	}
	public function getSpeciesPrefabByName (speciesName : String) {
		for(var i = 0; i < speciesList.length; i++) {
			//Debug.Log("ObjectLibrary log : speciesNames = " + speciesNames.length + ", speciesList = " + speciesList.length);
			if(speciesNames[i] == speciesName) return (speciesList[i] as Species).getPrefab();
		}
	}
	public function getSpeciesNames () {
		return speciesNames;
	}
	public function addSpecies (species : Species) {
		numSpecies++;
		if (numSpecies > speciesList.length) {
			// Resize speciesList and speciesNames
			var tempLength : int = speciesList.length;
			var tempList : Species[] = new Species[tempLength];
			System.Array.Copy(speciesList, tempList, tempLength);
			speciesList = new Species[2*tempLength];
			System.Array.Copy(tempList, speciesList, tempLength);
		}
		if (numSpecies > speciesNames.length) {
			var tempLength2 : int = speciesNames.length;
			var tempStringList : String[] = new String[tempLength2];
			System.Array.Copy(speciesNames, tempStringList, tempLength2);
			if (speciesNames.length != 0) {
				speciesNames = new String[2*tempLength2];
			} else {
				speciesNames = new String[8];
			}
			System.Array.Copy(tempStringList, speciesNames, tempLength2);
		}
		speciesList[numSpecies-1] = species;
		speciesNames[numSpecies-1] = species.getName();
	}
	public function removeEmptyNames () {
		var tempList : String[] = new String[numSpecies];
		System.Array.Copy(speciesNames, tempList, numSpecies);
		speciesNames = new String[numSpecies];
		System.Array.Copy(tempList, speciesNames, numSpecies);
	}
	public function getNumSpecies () {
		return numSpecies;
	}
}

public class Species {
	private var myType : Type;
	private var myName : String;
	private var myPrefab : GameObject;
	function Species (mt : Type, nm : String, pf : GameObject) {
		myType = mt;
		myName = nm;
		myPrefab = pf;
	}
	public function getType () {
		return myType;
	}
	public function getName () {
		return myName;
	}
	public function getPrefab () {
		return myPrefab;
	}
}

function Start () {
	var tempObjArray : Object[] = Resources.LoadAll("Furniture", GameObject);

	TypeList = new Type[TYPELIST_INIT_SIZE];
	TypeNames = new String[TYPELIST_INIT_SIZE];
	for (var go : Object in tempObjArray) {
		loadGOToList((go as GameObject));
	}
	for (var i : int = 0; i < numTypes; i++) {
		TypeNames[i] = TypeList[i].getName();
	}

}

public function getNumTypes() {
	return numTypes;
}	

public function loadGOToList (assetObj : GameObject) { 
	SetTagForAllChildren(assetObj, "InsertedObjectChildren");
	for (var t : Type in TypeList) {
		if (t == null) break;
		if (t.getName() == assetObj.tag) {
			t.addSpecies(new Species(t, assetObj.name, assetObj));
			return void;
		}
	}
	numTypes++;
	if (numTypes > TypeList.Length) {
		var tempLength : int = TypeList.length;
		var tempList : Type[] = new Type[tempLength];
		System.Array.Copy(TypeList, tempList, tempLength);
		TypeList = new Type[2*tempLength];
		System.Array.Copy(tempList, TypeList, tempLength);
	}
	if (numTypes > TypeNames.Length) {
		var tempLength2 : int = TypeNames.length;
		var tempList2 : String[] = new String[tempLength2];
		System.Array.Copy(TypeNames, tempList2, tempLength2);
		TypeNames = new String[2*tempLength2];
		System.Array.Copy(tempList2, TypeNames, tempLength2);
	}
	TypeList[numTypes-1] = new Type(assetObj.tag);
	TypeList[numTypes-1].addSpecies(new Species(TypeList[numTypes-1], assetObj.name, assetObj));
	TypeNames[numTypes-1] = assetObj.tag;
}

public function resizeTypeNames () {
	var tempLength : int = TypeNames.length;
	var tempList : String[] = new String[tempLength];
	System.Array.Copy(TypeNames, tempList, tempLength);
	TypeNames = new String[numTypes];
	System.Array.Copy(tempList, TypeNames, numTypes);
}

static function SetTagForAllChildren(gm: GameObject, str: String){
	for ( var child: Transform in gm.transform/* as Transform[]*/){
		child.gameObject.tag = str;
		SetTagForAllChildren(child.gameObject, str);
	}
}

static function ReturnTypeIndex (typeName : String) {
	if(typeName == "Street Furniture") return 0;
	else if(typeName == "Vegetation") return 1;
	else return -1;
}






