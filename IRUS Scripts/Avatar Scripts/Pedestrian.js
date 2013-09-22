#pragma strict

public var patrolLine : Array;

private var nextTargetPoint : Vector3;
private var startTime : float;
private var startPoint : Vector3;
private var startDirection : Quaternion;
public var speed : float = 0.0666;

//private var limit1 : GameObject;
//private var limit2 : GameObject;
//private var targetPos : GameObject;

function Start () {
	//var pedestrian : Animation = gameObject.GetComponent(Animation);
	//pedestrian.wrapMode = WrapMode.Loop;
	//pedestrian.Play(gameObject.GetComponent(AvatarManager).FindMotionName(gameObject.tag,"walk"));
	startTime = Time.time;
	startPoint = gameObject.transform.position;
	nextTargetPoint = gameObject.transform.position;
}

function Update () {
	if(patrolLine.length > 0) {
		MoveToNextTargetPoint();
	}
}

private function MoveToNextTargetPoint() {
	if(Line.isPointsApproximately(gameObject.transform.position,nextTargetPoint)) {
		startPoint = gameObject.transform.position;
		startDirection = gameObject.transform.rotation;
		var targetLine : Line;
		startTime = Time.time;
		while ((nextTargetPoint - startPoint).magnitude < 5.0 || (nextTargetPoint - startPoint).magnitude > 13.0) {
			targetLine = (patrolLine[Random.Range(0,patrolLine.length)] as Line);
			nextTargetPoint = (targetLine as Line).getP1() + (Random.value * ((targetLine as Line).getP2() - (targetLine as Line).getP1()));
		}
		return true;
	}
	var timeConsumed : float = speed*(Time.time - startTime);
	gameObject.transform.position = Vector3.Lerp(startPoint,nextTargetPoint,timeConsumed);
	gameObject.transform.rotation = Quaternion.Lerp(startDirection,Quaternion.LookRotation(nextTargetPoint - startPoint),5);
	//Debug.Log("Pedestrian log : Moving to target point = " + nextTargetPoint);
	//Debug.Log("Pedestrian log : Current Position = " + gameObject.transform.position);
	return false;
}

//For debugging purpose, we instantiate a utility pole at the nextTargetPoint.
private function GetPrefab( type : String){	
	for (var gm: GameObject in gameObject.Find("RoadHandler").GetComponent(RoadElementsArray).roadElementPrefabs){
		if (gm.name == type) return gm;
	}
	return null;
}




