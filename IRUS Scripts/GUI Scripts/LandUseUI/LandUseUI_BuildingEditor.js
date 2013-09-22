#pragma strict

public var skin : GUISkin;
public var folder : Texture2D;
public var dottedLine : Texture2D;

private var TAB_BUTTON_SIZE : int = 32;
private var HIDE_BUTTON_SIZE : Vector2 = new Vector2(93.0, 32.0);		// width, height
private var CLOSE_BUTTON_SIZE : Vector2 = new Vector2(93.0, 32.0);		// width, height
private var BUILDING_BUTTON_SIZE : int = 100;

/*	used to bypass crossdomain restriction when fetching data
	from domains without preferred crossdomain.xml (like maps.google.com)	*/
/*	use our app on appspot as a "proxy" to fetch for us	*/
private var BRIDGE_URL : String = "https://thisisforirusdevteam.appspot.com/bridge?url=";
//private var BRIDGE_URL : String = "http://localhost:8080/bridge?url=";

private var ORIGINAL_TOP_LEFT : Vector2 = new Vector2(57.0, 15.0);	// x, y
private var topLeft : Vector2;
private var SIZE : Vector2 = new Vector2(400.0, 408.0);		//	width, height
private var SIDE_BAR_WIDTH : float = 40.0;		//	the vertical area with the tab button
private var BUTTON_AREA_WIDTH : float = 150.0;	//	the area with all the building manipulation buttons
private var PHOTO_SIZE : Vector2 = new Vector2(180.0, 180.0);

private var onTop : boolean;	// am i the top layer?

private var RESOLUTION : int = 18;		// size of photo array
private var NUM_OF_PREFATCH : int = 3;	// actually prefatches NUM_OF_PREFATCH * 2 (two sides)

private var teranet : int;
private var parcel : Parcel;
private var address : String;
private var buildingObj : GameObject;
private var photo : Texture2D[] = new Texture2D[RESOLUTION];
private var photoCurrentInd : int;

private var uiAccessor : UIControl;
uiAccessor = GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(UIControl);

function OnEnable () {
	moveRight = false;
	moveLeft = false;
	topLeft = new Vector2(ORIGINAL_TOP_LEFT.x, ORIGINAL_TOP_LEFT.y);
	newContext(-1, null, "");
}


// these are for the pivots of the buttons (reference rects)
// they are the rects of the buttons
private var replace_rect : Rect;
private var manipulate_rect : Rect;
private var hide_building_rect : Rect;
// these are for rotated texts
private var title_pivot : Vector2;
private var replace_pivot : Vector2;
private var manipulate_pivot : Vector2;
private var hide_building_pivot : Vector2;

public function drawFrame () {
	var old_skin : GUISkin = GUI.skin;
	GUI.skin = skin;
	
	GUI.DrawTexture(Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y), folder);
	
	title_pivot = new Vector2(topLeft.x+SIZE.x-20, topLeft.y+22);
	
	if (replace_rect != null) {
		replace_pivot = new Vector2(topLeft.x+(SIZE.x-SIDE_BAR_WIDTH-BUTTON_AREA_WIDTH)+replace_rect.x-20,
			topLeft.y+replace_rect.bottom);
		manipulate_pivot = new Vector2(topLeft.x+(SIZE.x-SIDE_BAR_WIDTH-BUTTON_AREA_WIDTH)+manipulate_rect.right+20,
			topLeft.y+manipulate_rect.y);
		hide_building_pivot = new Vector2(topLeft.x+(SIZE.x-SIDE_BAR_WIDTH-BUTTON_AREA_WIDTH)+hide_building_rect.x-20,
			topLeft.y+hide_building_rect.bottom);
	}
	
	GUIUtility.RotateAroundPivot(90, title_pivot);
		GUI.Box(Rect(title_pivot.x, title_pivot.y, 999, 25), "BUILDING EDITOR");
	GUIUtility.RotateAroundPivot(-90, title_pivot);
	
	var size = GUI.skin.box.fontSize;
	var style = GUI.skin.box.fontStyle;
	GUI.skin.box.fontSize = 15;
	GUI.skin.box.fontStyle = FontStyle.Normal;
	GUIUtility.RotateAroundPivot(-90, replace_pivot);
		GUI.Box(Rect(replace_pivot.x, replace_pivot.y, 999, 25), "Replace Building");
	GUIUtility.RotateAroundPivot(90, replace_pivot);
	GUIUtility.RotateAroundPivot(90, manipulate_pivot);
		GUI.Box(Rect(manipulate_pivot.x, manipulate_pivot.y, 999, 25), "Manipulate Building");
	GUIUtility.RotateAroundPivot(-90, manipulate_pivot);
	GUIUtility.RotateAroundPivot(-90, hide_building_pivot);
		GUI.Box(Rect(hide_building_pivot.x, hide_building_pivot.y, 999, 25), "Hide Building");
	GUIUtility.RotateAroundPivot(90, hide_building_pivot);
	GUI.skin.box.fontSize = size;
	GUI.skin.box.fontStyle = style;
	
	GUILayout.BeginArea(Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y));
		// side bar
		GUILayout.BeginArea(Rect(SIZE.x-SIDE_BAR_WIDTH, 0, SIDE_BAR_WIDTH, SIZE.y));
			GUILayout.FlexibleSpace();
			GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
				if (GUILayout.Button("", "tabButton", GUILayout.Width(TAB_BUTTON_SIZE), GUILayout.Height(TAB_BUTTON_SIZE))) {
					if (!onTop) moveRight = true;
				}
			GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
			GUILayout.Space(26);
		GUILayout.EndArea();
var tempStatus : boolean = GUI.enabled;			/* these lines are meant to control if the gui contents should be enabled */
var contentEnabled : boolean = (teranet > 0);
if (!onTop) GUI.enabled = false;
if (!contentEnabled) GUI.enabled = false;
		// building buttons
		GUILayout.BeginArea(Rect(SIZE.x-BUTTON_AREA_WIDTH-SIDE_BAR_WIDTH, 0, BUTTON_AREA_WIDTH, SIZE.y));
			GUILayout.BeginVertical(); GUILayout.FlexibleSpace();
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					/*replace building*/
					if (GUILayout.Button("", "replaceButton", GUILayout.Width(BUILDING_BUTTON_SIZE), GUILayout.Height(BUILDING_BUTTON_SIZE))) {
						BuildingReplaceUI.parcel = parcel;
						gameObject.GetComponent(LandUseUI).closeAndOpenUI(UI.BuildingReplace);
					}
					if (Event.current.type == EventType.repaint) replace_rect = GUILayoutUtility.GetLastRect();	//	get reference points for the rotated texts
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
var tempStatus3 : boolean = GUI.enabled;
if (buildingObj == null) GUI.enabled = false;
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					/*manipulate building*/
					if (GUILayout.Button("", "manipulateButton", GUILayout.Width(BUILDING_BUTTON_SIZE), GUILayout.Height(BUILDING_BUTTON_SIZE))) {
						var tempArray: Array = new Array();
						tempArray.Add(buildingObj);
						EditBuildingUI.UpdateObjs = tempArray;
						gameObject.GetComponent(LandUseUI).closeAndOpenUI(UI.EditBuilding);

					}
					if (Event.current.type == EventType.repaint) manipulate_rect = GUILayoutUtility.GetLastRect();
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					/*hide building*/
					if (GUILayout.Button("", "hide_BuildingButton", GUILayout.Width(BUILDING_BUTTON_SIZE), GUILayout.Height(BUILDING_BUTTON_SIZE))) {
						if (parcel.getBuilding().isGhosting()) {
							parcel.getBuilding().showFull();
						} else {
							parcel.getBuilding().ghost();
						}
					}
					if (Event.current.type == EventType.repaint) hide_building_rect = GUILayoutUtility.GetLastRect();
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
			GUILayout.FlexibleSpace(); GUILayout.EndVertical();
		GUILayout.EndArea();
GUI.enabled = tempStatus3;
		// photo and hide/close buttons
		GUILayout.BeginArea(Rect(0, 0, SIZE.x-BUTTON_AREA_WIDTH-SIDE_BAR_WIDTH, SIZE.y)); GUILayout.BeginVertical();
			GUILayout.Space(10);
			GUI.skin.box.alignment = TextAnchor.MiddleCenter;
			if (teranet > 0) GUILayout.Box("Teranet PIN: "+teranet);
			else GUILayout.Box("No parcel selected\nClick on a building / parcel !");
			GUILayout.FlexibleSpace();
			var previousFontSize : int = GUI.skin.box.fontSize;
			GUI.skin.box.fontSize = 14;
			GUILayout.Box(address);
			GUI.skin.box.fontSize = previousFontSize;
			GUI.skin.box.alignment = TextAnchor.MiddleLeft;
			/*photo*/
			if (photo[photoCurrentInd] != null) {
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					GUILayout.Label(photo[photoCurrentInd], GUILayout.Width(PHOTO_SIZE.x), GUILayout.Height(PHOTO_SIZE.y));
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
				GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
					if (GUILayout.Button("<")) {
						photoCurrentInd = (photoCurrentInd-1+RESOLUTION)%RESOLUTION;
					}
					if (GUILayout.Button(">")) {
						photoCurrentInd = (photoCurrentInd+1)%RESOLUTION;
					}
				GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
			}
			GUILayout.FlexibleSpace();
			GUILayout.Label(dottedLine);
GUI.enabled = tempStatus;
if (!onTop) GUI.enabled = false;
			GUILayout.BeginHorizontal(); GUILayout.FlexibleSpace();
				if (GUILayout.Button("", "hideButton", GUILayout.Width(HIDE_BUTTON_SIZE.x), GUILayout.Height(HIDE_BUTTON_SIZE.y))) {
					gameObject.GetComponent(LandUseUI).hide();
				}
				if (GUILayout.Button("", "closeButton", GUILayout.Width(CLOSE_BUTTON_SIZE.x), GUILayout.Height(CLOSE_BUTTON_SIZE.y))) {
					gameObject.GetComponent(LandUseUI).closeProcedure();
				}
			GUILayout.FlexibleSpace(); GUILayout.EndHorizontal();
			GUILayout.Space(13);
		GUILayout.EndVertical(); GUILayout.EndArea();
	GUILayout.EndArea();
GUI.enabled = tempStatus;

	GUI.skin = old_skin;
	
	return new Rect(topLeft.x, topLeft.y, SIZE.x, SIZE.y);
}

public function newContext (t : int, p : Parcel, a : String) {
	teranet = t;
	parcel = p;
	if (p != null) {
		if (p.getBuilding() == null) {
			buildingObj = null;
		} else {
			buildingObj = p.getBuilding().gameObject;
		}
	}
	address = a;
	photoCurrentInd = 0;
	for (var i : int = 0; i < RESOLUTION; i++) {
		photo[i] = null;
	}
}

private function getPhoto (ind : int) {
	// set photo[ind] to new Texture2D(1,1) so that it doesn't repeatedly try to fetch
	if (photo[ind] == null) {
		photo[ind] = new Texture2D(1,1);
		yield downloadPhoto(ind);
	}
		//	loop from closest to farthest for a more responsive experience
		//	(e.g. if {ind = 2, NUM_OF_PREFATCH = 3, RESOLUTION = 18},
		//		then it will fetch in this order : 3, 1, 4, 0, 5, 17)
	for (var j : int = 1; j <= NUM_OF_PREFATCH; j++) {
		if (photo[(ind+j)%RESOLUTION] == null) {
			photo[(ind+j)%RESOLUTION] = new Texture2D(1,1);
			yield downloadPhoto(((ind+j)%RESOLUTION+RESOLUTION)%RESOLUTION);
		}
		if (photo[((ind-j)%RESOLUTION+RESOLUTION)%RESOLUTION] == null) {
			photo[((ind-j)%RESOLUTION+RESOLUTION)%RESOLUTION] = new Texture2D(1,1);
			yield downloadPhoto(((ind-j)%RESOLUTION+RESOLUTION)%RESOLUTION);
		}
	}
}

private function downloadPhoto (ind : int) {
	// the coressponding degree of ind is ind*(360/RESOLUTION)
	
	// here we send the api url as a parameter to our app to fetch the image
	var www = new WWW(BRIDGE_URL+WWW.EscapeURL("http://maps.googleapis.com/maps/api/streetview?size="+
						PHOTO_SIZE.x+"x"+PHOTO_SIZE.y+"&location="+WWW.EscapeURL(address.Replace("\n", " "))+
						"&sensor=false&heading="+Mathf.RoundToInt(ind*(360/RESOLUTION))));
	yield www;
	if (www.error == null) {
		photo[ind] = www.texture;
	}
}

private var moveRight : boolean;
private var moveLeft : boolean;
private var MOVE_SPEED : float = 1700.0;

function Update () {
	if (moveRight) {
		topLeft.x += MOVE_SPEED*Time.deltaTime;
		if (topLeft.x-ORIGINAL_TOP_LEFT.x > SIZE.x) {
			moveLeft = true;
			moveRight = false;
			gameObject.GetComponent(LandUseUI).pushLayerToTop(LandUseLayer.BuildingEditor);
		}
	} else if (moveLeft) {
		topLeft.x -= MOVE_SPEED*Time.deltaTime;
		if (topLeft.x < ORIGINAL_TOP_LEFT.x) {
			topLeft.x = ORIGINAL_TOP_LEFT.x;
			moveLeft = false;
		}
	}
	
	if (address != "") getPhoto(photoCurrentInd);	// fetch/prefatch photos
}

public function setOnTop (b : boolean) {
	onTop = b;
}