#pragma strict

private var pedestrianDeactivated : Boolean = false;

function Start () {

}

function Update () {

}

public function GetPrefab ( type : String) : GameObject {
	return gameObject.GetComponent(AvatarBackend).GetPrefab(type);
}

/*
	The femaleRatio, maleRatio and the seniorRatio should add up to be 1 and check prior entering this function
*/
public function CreatePedestrian (unityName : String, creationPosition : Vector3, patrolLine : Array, numPedestrian : int, femaleRatio : float, maleRatio : float, seniorRatio : float) {
	/*
		Usually, the CreatePedestrian method is called after we destroyed the Pedestrian holder.
		However, the destruction of the actual gameobject(Pedestrian Holder) is done after one Update().
		Therefore, if we are creating the pedestrian after we destroy them in the same frame,
		the pedestrian holder will still appear to be there, which is why I yield for 0.0001 seconds to
		ensure that the Pedestrian Holder is really destroyed.
	*/
	if(pedestrianDeactivated) {
		Debug.Log("AvatarManager log : Pedestrian is deactivated");
	} else {
		yield WaitForSeconds(0.0001);
		var pedestrianHolder : GameObject = GameObject.Find("/AvatarHandler/Pedestrian/"+unityName);
		if(pedestrianHolder == null) {
			pedestrianHolder = new GameObject();
			pedestrianHolder.name = unityName;
			pedestrianHolder.transform.parent = gameObject.Find("/AvatarHandler/Pedestrian").transform;
		}

		var pedestrian : GameObject;
		for(var i = 0; i < Mathf.Round(numPedestrian*femaleRatio); i++) {
			pedestrian = Instantiate(gameObject.GetComponent(AvatarBackend).GetRandomPrefabOfType("female"), creationPosition, Quaternion.LookRotation(Vector3(0,0,-1)));
			pedestrian.transform.parent = pedestrianHolder.transform;
			pedestrian.tag = "FemalePedestrian";
			pedestrian.AddComponent(Pedestrian);
			SetPedestrianMotion(pedestrian,"walk");
			pedestrian.GetComponent(Pedestrian).patrolLine = patrolLine;
		}
		for(i = 0; i < Mathf.Round(numPedestrian*maleRatio); i++) {
			pedestrian = Instantiate(gameObject.GetComponent(AvatarBackend).GetRandomPrefabOfType("male"), creationPosition, Quaternion.LookRotation(Vector3(0,0,-1)));
			pedestrian.transform.parent = pedestrianHolder.transform;
			pedestrian.tag = "MalePedestrian";
			pedestrian.AddComponent(Pedestrian);
			SetPedestrianMotion(pedestrian,"walk");
			pedestrian.GetComponent(Pedestrian).patrolLine = patrolLine;
		}
		for(i = 0; i < Mathf.Round(numPedestrian*seniorRatio); i++) {
			pedestrian = Instantiate(gameObject.GetComponent(AvatarBackend).GetRandomPrefabOfType("senior"), creationPosition, Quaternion.LookRotation(Vector3(0,0,-1)));
			pedestrian.transform.parent = pedestrianHolder.transform;
			pedestrian.tag = "SeniorPedestrian";
			pedestrian.AddComponent(Pedestrian);
			SetPedestrianMotion(pedestrian,"walk");
			pedestrian.GetComponent(Pedestrian).patrolLine = patrolLine;
		}
	}
}

public function ChangePatrolLineOfPedestrian (unityName : String, patrolLine : Array) {
	if(pedestrianDeactivated) {
		Debug.Log("AvatarManager log : Pedestrian is deactivated");
		return false;
	}
	var pedestrianHolder : GameObject = gameObject.Find("/AvatarHandler/Pedestrian/"+unityName);
	if(pedestrianHolder == null) {
		Debug.Log("AvatarManager log : " + unityName + " has no pedestrians on it, cannot change patrol line");
		return false;
	}
	for (var child : Transform in (pedestrianHolder.transform)) {
		child.GetComponent(Pedestrian).patrolLine = patrolLine;
	}
	return true;
}

public function SetPedestrianMotion ( pedestrian : GameObject, motion : String) {
	var pedestrianAnimation : Animation = pedestrian.GetComponent(Animation);
	pedestrianAnimation.wrapMode = WrapMode.Loop;
	pedestrianAnimation.Play(FindMotionName(pedestrian.tag,motion));
}

/*
	As different prefabs have different names for different motion, e.g. :
	OfficeLady's walk -> female_walk
	OfficeMan's walk -> walk

	This function serves as a translation to the motion, below is a list of motion's name:
	walk run idle jump

	There are a lot more, please check the prefab to see the list of Animations
	and add it here if you wish to expand the table
*/
public function FindMotionName ( tag : String, motion : String) {
	if (tag == "FemalePedestrian") {
		if (motion == "walk") {
			return "female_walk";
		} else if (motion == "run") {
			return "female_run";
		} else if (motion == "idle") {
			return "female_idle";
		} else if (motion == "jump") {
			return "female_jump";
		}
	} else if (tag == "MalePedestrian") {
		if (motion == "walk") {
			return "walk";
		} else if (motion == "run") {
			return "run";
		} else if (motion == "idle") {
			return "idle";
		} else if (motion == "jump") {
			return "jump";
		}
	} else if (tag == "SeniorPedestrian") {
		if (motion == "walk") {
			return "walk";
		} else if (motion == "run") {
			return "run";
		} else if (motion == "idle") {
			return "idle_01";
		} else if (motion == "jump") {
			return "jump";
		}
	}
}

public function ResumePedestrian () {
	pedestrianDeactivated = false;
}

public function DeactivatePedestrian () {
	pedestrianDeactivated = true;
	DestroyAllPedestrian();
}

public function DestroyAllAvatars () {
	DestroyAllPedestrian();
	Debug.Log("AvatarManager log : All Avatars are destroyed");
}

public function DestroyAllPedestrian () {
	for(var child : Transform in (GameObject.Find("/AvatarHandler/Pedestrian").transform/* as Transform[]*/)) {
		UnityEngine.Object.Destroy(child.gameObject);
	}
	Debug.Log("AvatarManager log : All Pedestrians are destroyed");
}

public function DestroySidewalkPedestrian (unityName : String) {
	var object : GameObject = gameObject.Find("/AvatarHandler/Pedestrian/" + unityName);
	if(object != null) {
		UnityEngine.Object.Destroy(object);
		//Debug.Log("AvatarManager log : Pedestrians on " + unityName + " are destroyed");
	} else {
		Debug.Log("AvatarManager log : There is no pedestrian on the sidewalk " + unityName);
	}
}










