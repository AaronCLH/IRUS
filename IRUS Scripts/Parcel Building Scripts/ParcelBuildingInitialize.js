// Parcel Building Initialize - To initialize the parcel, building, setbacklines, and massing script instances on runtime

#pragma strict

// hard-coded for initial environment
// map buildings to parcels (** not a one-to-one relationship)

public var buildings : GameObject[];			// Array of building GameObjects (from the scene)
public var parcels : GameObject[];				// Array of parcel GameObjects (from the scene)

public var freeWallPrefab : GameObject;			// Prefab object for Parcel script
public var occupiedWallPrefab : GameObject;		// Prefab object for the parcel script
public var setbackWallPrefab : GameObject;		// prefab object for the setback script
public var massingMaterial : Material;			// material for the massing script

public var buildingsParent : GameObject;		// The parent GameObject of all buildings
public var parcelsParents : GameObject[];		// The parent GameObjects for each group of parcels
public var uptownBuildings: GameObject;
public var uptownParcels: GameObject;

function Start () {
	var p : Parcel;
	var sbLines : SetbackLines;
	var massing : Massing;
	for (var gm : Object in buildingsParent.transform) {
		for (var t : Object in gm) {
			if ((t as Transform).gameObject.active) { // If the building is active, add a building script to it.
				(t as Transform).gameObject.AddComponent(Building);
			}
		}
	}
	for (var pp : GameObject in parcelsParents) { // For each parcel parent game object, go through its children and add a
												  // parcel, setbacklines, and massing script instance to each child.
		for (t in pp.transform) {
			if ((t as Transform).gameObject.active) {
				p = (t as Transform).gameObject.AddComponent(Parcel);
				p.provideFreeWallPrefab(freeWallPrefab);
				p.provideOccupiedWallPrefab(occupiedWallPrefab);
				sbLines = (t as Transform).gameObject.AddComponent(SetbackLines);
				sbLines.provideWallPrefab(setbackWallPrefab);
				massing = (t as Transform).gameObject.AddComponent(Massing);
				massing.provideMaterial(massingMaterial);
			}
		}
	}
	for (var i : int; i < buildings.length; i++) { // Simple helper function called for each building
		mapBuildingParcel(buildings[i], parcels[i]);
	}
	// This is used to map the Parcels to the Buildings.  It currently doesnt work since we dont have empty instances in the database for the Pin numbers of the massing models.
	// Also, i realized that the land use editor uses the name of the parcel game objects from index 0 of the name. You will have to fix it so that it starts after Building_
	
	
		for (var child : Transform in uptownParcels.transform/* as Transform[]*/){
		p = child.gameObject.AddComponent(Parcel);
		p.provideFreeWallPrefab(freeWallPrefab);
		p.provideOccupiedWallPrefab(occupiedWallPrefab);
		sbLines = child.gameObject.AddComponent(SetbackLines);
		sbLines.provideWallPrefab(setbackWallPrefab);
		massing = child.gameObject.AddComponent(Massing);
		massing.provideMaterial(massingMaterial);
	}

	
	
	for (var child : Transform in uptownBuildings.transform/* as Transform[]*/){
		var currPIN: String;
		//currPIN = child.gameObject.name.Substring(9, 9);
		//Debug.Log(child.gameObject.name);
		if (child.gameObject.name.length >= 19){
			//Debug.Log(child.gameObject.name + "got in");
			var firstBuilding: GameObject = gameObject.Find("Building_" + currPIN);
			if (firstBuilding != null){
				child.parent = firstBuilding.transform;
			}
			else {
				//Debug.Log("Error");
			}
		}
		else {
			child.gameObject.AddComponent(Building);
			for (var child2 : Transform in uptownParcels.transform/* as Transform[]*/){
				if (child2.gameObject.name.Substring(7,9) == currPIN){
					//Debug.Log(currPIN);
					mapBuildingParcel(child.gameObject, child2.gameObject);
					break;
				}
			}
		}
	}
	
	
	
	
	Destroy(this); // A heroic script knows that its time is up, and in an effort to speed up the code for the greater good,
				   // it destroys itself
}

// Simple helper function that sets the parcel in the building script, and the building in the parcel script
private function mapBuildingParcel (b : GameObject, p : GameObject) {
	var building : Building = b.GetComponent(Building);
	var parcel : Parcel = p.GetComponent(Parcel);
	building.occupyParcel(parcel);
	parcel.occupiedByBuilding(building);
}