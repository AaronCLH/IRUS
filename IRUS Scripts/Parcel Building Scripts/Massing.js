// Massing Script - For controlling that massing object that can be altered in the parcel editor
// 
// Notes: 
//
//  *	This script assumes four lot lines, the next challenge will be to make this massing for an
// 		arbitrary number of lot lines. 
//
//  *	Depends on the order in which the setback lines are created.
//
//  *	You may want to figure out how to calculate normals on the mesh that is created, so that the material
// 		can actually be rendered in the proper direction. Shouldn't be too hard (each side is a plane with four points)
// 		but we ran out of time.

#pragma strict

private var triangles : int[] = new int[36];		// The triangles in the mesh
private var vertices : Vector3[] = new Vector3[8];	// The vertices in the mesh
private var massingMaterial : Material;				// The material used for the massing object
private var massingObj : GameObject;				// The actual massing GameObject
private var massingOn : boolean;					// Is the massing object active?
private var savedHeight : float;					// The height of the massing currently (needed in recalculateMassing)

function Start () {
	massingOn = false;								
}

function Update () {

}

// This function recalculates the massing object (needed when the max/min heights are changed in the parcel editor)
public function recalculateMassing () {
	if (massingObj != null) Destroy(massingObj);
	massingObj = Instantiate(new GameObject());
	var filter : MeshFilter = massingObj.AddComponent(MeshFilter);
	filter.mesh = createMesh(gameObject.GetComponent(SetbackLines).getPOIs()); // Calls the helper function, using the points of intersection
																			   // inside of the setback lines script
	filter.mesh.RecalculateNormals(); // This only seems to work some of the time.
	var rend : MeshRenderer = massingObj.AddComponent(MeshRenderer);
	rend.material = massingMaterial;
	massingObj.AddComponent(MeshCollider);
}

// This function renders the massing object (called in the parcel editor as well)
public function showMassing (height : float) {
	if (massingObj == null) { // If there is no massing object already, then make one
		massingObj = Instantiate(new GameObject());
		var filter : MeshFilter = massingObj.AddComponent(MeshFilter);
		filter.mesh = createMesh(gameObject.GetComponent(SetbackLines).getPOIs());
		filter.mesh.RecalculateNormals();
		var rend : MeshRenderer = massingObj.AddComponent(MeshRenderer);
		rend.material = massingMaterial;
		massingObj.AddComponent(MeshCollider);
	}
	savedHeight = height;
	massingObj.transform.localScale.y = height; // Setting the scale to be the inputted height value make the height of the massing object
												// equal the inputted height, because the mesh is initialized with a height of 1.0
	massingObj.active = true;
	massingOn = true;
}		

// This function hides the massing object
public function hideMassing () {
	if (massingObj != null) {
		massingObj.active = false;
		massingOn = false;
		massingObj.transform.localScale.y = 0;
	}
}

// This function checks is the massing object is on
public function checkMassingState() {
	return massingOn;
}

// This function provides the massing material (called in ParcelBuildingInitialize)
public function provideMaterial (mat : Material) {
	massingMaterial = mat;
}

// Creates the mesh of the massing object for a 4-sided parcel. lowVert is the vertices used for the base 
// of the massing object's mesh.
private function createMesh(lowVert : Vector3[]) {
	Debug.Log("Creating Meshes..");
	System.Array.Copy(lowVert, vertices, 4);
	for(var i : int = 4; i < 8; i++) vertices[i] = lowVert[i-4] + new Vector3(0, 1.0, 0);
	var curPos : int = 0;
	var triPos : int = 0;
	// Two triangles for the base
	for (i = 0; i < 2; i++) {
		triangles[triPos] = curPos;
		triangles[triPos + 1] = nextIndex(curPos);
		curPos = nextIndex(nextIndex(curPos));
		triangles[triPos + 2] = curPos;
		triPos += 3;
	}
	// Two triangles on each side for four sides
	for (i = 0; i < 4; i++) {
		triangles[triPos] = curPos;
		triangles[triPos + 1] = curPos + 4;
		triangles[triPos + 2] = nextIndex(curPos) + 4;
		triangles[triPos + 3] = nextIndex(curPos);
		triangles[triPos + 4] = curPos;
		triangles[triPos + 5] = nextIndex(curPos) + 4;
		triPos += 6;
		curPos = nextIndex(curPos);
	}
	// Two triangles for the top
	for (i = 0; i < 2; i++) {
		triangles[triPos] = curPos + 4;
		triangles[triPos + 1] = nextIndex(curPos) + 4;
		curPos = nextIndex(nextIndex(curPos));
		triangles[triPos + 2] = curPos + 4;
		triPos += 3;
	}
	var mesh : Mesh = new Mesh();
	mesh.vertices = vertices;
	mesh.triangles = triangles;
	return mesh;	
}		
	
			
// Calculates the next index of the lower vertex array to use based on the construction of the
// array in the Setbacks script	
private function nextIndex (ind : int) {
	if (ind == 0) return 1;
	else if (ind == 1) return 3;
	else if (ind == 2) return 0;
	else return 2;
}