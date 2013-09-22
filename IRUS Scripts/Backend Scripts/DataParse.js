#pragma strict

//private var dataParseRunning : Boolean = false;

static class DataParse {
	/*function DataParse () {
		Debug.Log("DataParse log : DataParse running");
	}*/

	static function StringToVector3 (dataString : String) {
		var vector3Array : String[] = dataString.Substring( dataString.IndexOf("(") + 1, dataString.IndexOf(")") - dataString.IndexOf("(") - 1).Split(","[0]);
		if(vector3Array.length != 3) {
			Debug.Log("DataParse log : Vector3 string does not have 3 values");
		}
		/*for(var component in vector3Array) {
			
		}*/
		return Vector3(parseFloat(vector3Array[0]),parseFloat(vector3Array[1]),parseFloat(vector3Array[2]));
	}

	static function StringToQuaternion (dataString : String) {
		var quaternionArray : String[] = dataString.Substring( dataString.IndexOf("(") + 1, dataString.IndexOf(")") - dataString.IndexOf("(") - 1).Split(","[0]);
		if(quaternionArray.length != 4) {
			Debug.Log("DataParse log : Quaternion string does not have 4 values");
		}
		/*for(var component in quaternionArray) {
			Debug.Log("DataParse log : Quaternion String = " + component);
		}*/
		return Quaternion(parseFloat(quaternionArray[0]),parseFloat(quaternionArray[1]),parseFloat(quaternionArray[2]),parseFloat(quaternionArray[3]));
	}

	static function ConvertBetweenTypesAndCode (type: String) {
	    /*
	    left and right Types : String[]
	    
	        Sidewalk -> S                   Car -> C
	        BikeLane -> B                   Light Truck -> L
	        Green Space -> G                 Heavy Truck -> H
	        Parking -> P                    Bus Rapid Transit -> R
	                                        Light Rail Transit -> T
	    */
		if(type.length != 1){
			if(type == "Sidewalk"){
			    return "S";
			} else if(type == "BikeLane") {
			    return "B";
			} else if(type == "Green Space") {
			    return "G";
			} else if(type == "Parking") {
			    return "P";
			} else if(type == "Car") {
			    return "C";
			} else if(type == "Light Truck") {
			    return "L";
			} else if(type == "Heavy Truck") {
			    return "H";
			} else if(type == "Bus Rapid Transit") {
			    return "R";
			} else if(type == "Light Rail Transit") {
			    return "T";
			} else {
			    Debug.Log("DataParse log : Invalid Types");
			}
		} else {
			if(type == "S"){
			    return "Sidewalk";
			} else if(type == "B") {
			    return "BikeLane";
			} else if(type == "G") {
			    return "Green Space";
			} else if(type == "P") {
			    return "Parking";
			} else if(type == "C") {
			    return "Car";
			} else if(type == "L") {
			    return "Light Truck";
			} else if(type == "H") {
			    return "Heavy Truck";
			} else if(type == "R") {
			    return "Bus Rapid Transit";
			} else if(type == "T") {
			    return "Light Rail Transit";
			} else {
			    Debug.Log("DataParse log : Invalid Code");
			}
		}
	}

}
/*
function Start () {
	dataParseRunning = true;
	Debug.Log("DataParse log : DataParse running");
}

function Update () {

}

public function DataParseRunning () {
	return dataParseRunning;
}
*/



