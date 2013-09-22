#pragma strict

function Update () {
	for(var child : Transform in gameObject.transform) {
		UnityEngine.Object.Destroy(child.gameObject);
	}
}