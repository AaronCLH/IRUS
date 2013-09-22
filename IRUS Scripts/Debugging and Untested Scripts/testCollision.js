#pragma strict

function OnCollisionEnter (collisionInfo : Collision) {
	Debug.Log(collisionInfo.collider.transform.parent.name);
	for (var contact : ContactPoint in collisionInfo.contacts) {
		Debug.DrawRay(contact.point, contact.normal, Color.white);
	}
}