#pragma strict

public var roadElementPrefabs: GameObject [];
public var roadElementPrefabNames: String [];
public var roadElementTexturesLeft: Texture2D [];
public var roadElementTexturesRight: Texture2D [];
public var roadElementTexturesMedian: Texture2D [];
public var roadElementAccessoriesTextures: Texture2D [];
function Start () {
	var arrLen = roadElementPrefabs.length;
	roadElementPrefabNames = new String [arrLen];
	for (var i = 0 ; i < arrLen; i++){
		roadElementPrefabNames[i] = roadElementPrefabs[i].name;
	}
}