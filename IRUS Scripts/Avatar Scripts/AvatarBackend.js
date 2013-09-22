#pragma strict

public var femaleAvatarPrefabs: GameObject [];
public var maleAvatarPrefabs: GameObject [];
public var seniorAvatarPrefabs: GameObject [];
public var carAvatarPrefabs: GameObject [];
public var busAvatarPrefabs: GameObject [];
public var truckAvatarPrefabs: GameObject [];
public var policeAvatarPrefabs: GameObject [];

public var avatarPrefabs: Array;

function Awake () {
	avatarPrefabs = [femaleAvatarPrefabs,maleAvatarPrefabs,seniorAvatarPrefabs,carAvatarPrefabs,busAvatarPrefabs,truckAvatarPrefabs,policeAvatarPrefabs];
}

public function GetPrefab (type : String) : GameObject {
	for(var elementArray in avatarPrefabs) {
		for(var element in elementArray) {
			if(type == (element as GameObject).name) {
				return element as GameObject;
			}
		}
	}
	Debug.Log("AvatarBackend log : No " + type + "(prefab) exists");
	return null;
}

public function GetRandomPrefabOfType (type : String) {
	var prefabs : GameObject[] = GetListOfPrefabs(type);
	if(prefabs == null) {
		Debug.Log("AvatarBackend log : No " + type + "(prefab) exists");
		return null;
	}
	return prefabs[Random.Range(0,prefabs.length)];
}

public function GetListOfPrefabs (type : String) {
	if (type == "female") {
		return femaleAvatarPrefabs;
	} else if (type == "male") {
		return maleAvatarPrefabs;
	} else if (type == "senior") {
		return seniorAvatarPrefabs;
	} else if (type == "car") {
		return carAvatarPrefabs;
	} else if (type == "bus") {
		return busAvatarPrefabs;
	} else if (type == "truck") {
		return truckAvatarPrefabs;
	} else if (type == "police") {
		return policeAvatarPrefabs;
	} else {
		Debug.Log("AvatarBackend log : No such list of prefabs exists");
		return null;
	}
}






