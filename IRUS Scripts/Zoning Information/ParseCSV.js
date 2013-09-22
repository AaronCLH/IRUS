// ParseCSV - Handles looking up into the Zoning Table and producing the relevant information

#pragma strict

static var ZoneClasses : ZoningClasses; // Static reference to the Zoning Classes class that does the work in parsing the CSV File

public var csvFile : TextAsset; // The file that is parsed

function Start () { // Parse the CSV File at the start of the script
	ZoneClasses = new ZoningClasses(csvFile);
}

public class ZoningClasses { // This class parses the CSV file, and puts the results in an array of ZoningInfo objects
	static var NUM_CLASSES : int; 				// The number of zoning classes in the file
	private var classes : ZoningInfo[]; 		// The actual information relating to a zone class
	
	function ZoningClasses (file : TextAsset) { // This function parses the csv file and stores the results in classes
		NUM_CLASSES = file.text.Split("\n"[0]).length;
		classes = new ZoningInfo[NUM_CLASSES];
		var lines : String[] = new String[NUM_CLASSES];
		lines = file.text.Split("\n"[0]); // Split the file into lines, using the newline character
		for (var i : int = 0; i < NUM_CLASSES; i++) {
			classes[i] = ZoningInfo(lines[i].Split(","[0])); // For each line, split the data using the comma
		}
	}
	
	public function getZoningData (zone : String) { // This function gets the ZoningInfo object related to the zone string
		if (zone == null) return null;
		for (var cls : ZoningInfo in classes) {
			if (cls.name == zone) return cls;
		}
		Debug.Log("No zoning class with that name exists. Allowable names are: "); // To denote an incorrect zone query
		for (var cls : ZoningInfo in classes) {
			Debug.Log(cls.name);
		}
		return null;
	}
}

public class ZoningInfo { // This class stores the zoning information related to a particular zoning class
	public var setbackAmounts : float[] = new float[4]; //Always goes in this order: Front, Rear, Side, Flankage
	public var maxHeight : float;
	public var minHeight : float;
	public var name : String;
	function ZoningInfo(info : String[]) { // Constructor function takes in an array of strings corresponding to zone data
		name = info[0];
		setbackAmounts[0] = parseFloat(info[1]);
		setbackAmounts[1] = parseFloat(info[4]);
		setbackAmounts[2] = parseFloat(info[3]);
		setbackAmounts[3] = parseFloat(info[2]);
		maxHeight = parseFloat(info[5]);
		minHeight = parseFloat(info[6]);
		if (Mathf.Approximately(maxHeight, 0.0)) maxHeight = 36.0;
	}
}	