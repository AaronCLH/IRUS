#pragma strict

/* 
	This Script is the GUI for manipulating road segments. This Script relies heavily on RoadSegmentInstantiation and RoadSegmentMain.  
	RoadSegmentInstantiation performs the calculations to determine edges of the road segment.  It also provides the roadWidth.  
	Every Road Segment is given a RoadSegmentInstantiation script.
	The RoadSegment UI is attached to the UI Handler and the Road Segment Main is attached to the Road Handler along with the Road Elements Array and the Roads Backend.
*/
//import System.Text.RegularExpressions;

// Right of Way Editor Layout variables
private var rightOfWayEditorWidth : int = 1200;
private var dropDownMenuHeight : int = 300;
public var skin : GUISkin;						// The skin being used -> ROWskin
private var uiAccessor : UIControl; 			// All hail UIControl. All hail UIControl.

// Right of Way Editor menu items variables
private var menuEnabled : Boolean;  			// The menu is enabled once a road segment has been clicked on
private var spaceConfigured : Boolean = false;  // After road is initialized, spaceConfigured = true: Start drawing slider
private var previewMode : Boolean = false;		// Indication of the preview mode
private var changesMade : boolean = false; 		// Keeping track of changes made, if true when closing editor, then revert changes from the global change list
private enum ScreenView {
	StreetConfiguration,
	MedianZone,
	CurbsideZone,
	TrafficZone
}
private var pedestrianDisabled : Boolean = false;
private var activeView : ScreenView;  						// Keeping track of which menu is currently opened
private var defaultViewChanged : Boolean = false;			// This variable is used when the user switches default view(eg. Curbside editor to vehicle lane editor), it tells the editor to make changes
private var multipleRefreshingDebugger : Boolean = false;	// Event.current once changed will span over a few seconds which is a lot in OnGUI(), this variable is to ensure things to be run only once

// Variable for Road Selection
private var range : int = 50;   // range of the RAYCAST

// Variables for Multiple Road Segments
private var multipleSegments : boolean = false;	// True -> there are multiple segments of the selected roadSegmentObject
private var unityNamesArray : String[];			// Contains an array of multiple segments of the selected roadSegmentObject

// Variables for intersections connecting the road segments
private var intersectionNamesArray : String[];

// Localized variables used within the Right of Way Editor
/*
	These variables are first initialized when a road segment is selected/"clicked". Initially, it is a copy of variables from the InstantiateRoadElements.js scripts
	They are then modified by the user in the Right of Way Editor. They should NOT be updated to the InstantiateRoadElements script until "Apply Changes" is clicked.
*/
private var roadSegmentObject : GameObject;  			// The GameObject that hit by raycast
private var roadSegmentInfo : InstantiateRoadElements;	// Contains the variables stored in the roadSegmentObject -> InstantiateRoadElements.js
public var instructionMsg : String = "";				// Instruction Message that being displayed on the header -> see also InstructionMessageType(message) and InstructionMessage(message)
private var unityName : String;							// The Unique Unity Name of the road segment -> eg. 7_ROAD_223670002_538169.34390259_-4813323.03674316_18
private var roadWidth : float;							// Road Width
private var roadName : String;							// Street Name
private var roadType : streetClassType;					// Road Type -> eg. CityRoad, MajorCollector and MinorCollector
private var pattern = new Regex("([a-z])([A-Z])"); 		// Regex regular expression to modify string from "CityRoad" to "City Road" -> being used by roadType
private var isOneWay : Boolean;							// True -> is a one way street
private var numSegmentsLeft: int;						// Number of Segments on the left side of the street
private var numSegmentsRight: int;						// Number of Segments on the right side of the street
private var leftTypes : String[];						// Contains the lane types of the left side of the street -> 0 from the leftmost
private var rightTypes : String[];						// Contains the lane types of the right side of the street -> 0 from the rightmost
private var leftWidths : float[];						// Contains the lane widths of the left side of the street -> 0 from the leftmost
private var rightWidths : float[];						// Contains the lane widths of the right side of the street -> 0 from the rightmost
private var medianType : String;						// Median Type
private var medianWidth : float;						// Median Width
private var currOffset: float[];						// The offsets of the lanes calculated from the left to the right. Note: It does not include the "last" offset, ie the width of the entire street

// Undo / (Redo) List variables
public var numRowsOfUnredoList : int = -1;	// -1 to extract the entire list
private var unredoList : String[];			// An array to contain the localized changes -> format: 7_ROAD_224120001_538638.00844192_-4812574.8454895_24,0,4,SBCC,2.4_2.4_3.36_3.36,Painted Line,0.96,4,SBCC,2.4_2.4_3.36_3.36
private var listPointer : int = 0;			// Pointer for the unredo list, should be set to the end of the unredo list

// Draw Slider variables
private var currPos : float;		// The slider position -> being used to calculate which segment/lane is being selected by user
private var drag : boolean = false;	// Used in the boundary selector of the Cross Section Area, True -> when the user is dragging the boundary selector
private var selectedBoundary : int;	// Which boundary selector is being selected

// Street Layout Configuration
private var numSegmentsLeftTextbox : String;
private var numSegmentsRightTextbox : String;
private var numSegmentsLeftTemp : int;
private var numSegmentsRightTemp : int;
private var tempLeftTextbox : String = "";
private var tempRightTextbox : String = "";
private var tempSliderLeft : float;
private var tempSliderRight : float;

// Common Variables used by the Configuration Menu
private var tempSlider : float;			// Saves the value produced from the slider
private var tempTextbox : String = "";  // Temporarily saves the value typed into a textbox

// Median Zone Configuration
/*
	public var medianZoneMinWidth = {	"Painted Line" : 0.1,
										"Turning Lane" : 4,
										"Separated Median" : 1.2,
										"Median Bus Rapid Transit" : 7,
										"Median Light Rail Transit" : 7
									 };
*/

private var medianWidthTemp : float = 0;					// The value that represents the current width.  Changed by either the slider or textbox
private var medianWidthSlider : float;						// The value used for displaying on the slider
private var medianWidthTextbox : String;					// The value used for displaying on the textbox
private var medianSelected : int = 0;
public var medianStrings : String[];						// The array of strings representing the strings
public var medianImages : Texture2D[];						// The array of Textures corresponding to those strings.  These are used for buttons
private var medianButtons : GUIContent [];					// The array of GUIContent that are a combination of the string and image.  
private var medianMinimums : float[] = [0.1, 4, 1.2, 7, 7];	// The Minimum Widths of the Medians
private var medianMaximums : float [] = [0.2, 2, 2, 10, 10];// The Maximum Widths of the Medians
private var medianMin : float;								// The minimum value of the currently selected median
private var medianMax : float;								// The maximum value of the currently selected median

// Curbside Zone Configuration
/*
	public var curbsideZoneMinWidth = {	"Sidewalk" : 1.2,
										"BikeLane" : 1.5,
										"Green Space" : 0.6,
										"Parking" : 2.4
									 };
*/

private var curbsideWidthTemp : float = 0;
private var curbsideWidthSlider : float;
private var curbsideWidthTextbox : String;
private var curbsideSelected : int = 0;
public var curbsideStrings : String[];
public var curbsideImages : Texture2D[];
private var curbsideButtons : GUIContent [];
private var curbsideMinimums : float[] = [1.2, 1.5, 0.6, 2.4];
private var curbsideMaximums : float [] = [15.0, 2.0, 5.0, 3.0];
private var curbsideMin : float;
private var curbsideMax : float;

// Traffic Zone Configuration
/*
	public var trafficZoneMinWidth = {	"Car" : 3.05,
										"Light Truck" : 3.355,
										"Heavy Truck" : 3.66,
										"Bus Rapid Transit" : 3.35,
										"Light Rail Transit" : 3.35
									 };
*/

private var trafficWidthTemp : float = 0;
private var trafficWidthSlider : float;
private var trafficWidthTextbox : String;
private var trafficSelected : int = 0;
public var trafficStrings : String[];
public var trafficImages : Texture2D[];
private var trafficButtons : GUIContent[];
private var trafficMinimums : float[] = [3.05, 3.35, 3.66, 3.35, 3.35];
private var trafficMaximums : float [] = [5.0, 5.0, 5.0, 5, 5];
private var trafficMin : float;
private var trafficMax : float;

private var ticker : Boolean = false;
private var tickerTimerInUse : Boolean = false;
/*
public var testGUI : Boolean;
public var testx : float = 95;
public var testy : float = 25;
public var testwidth : float = 760;
public var testheight : float = 3;

private var messageDisplay : MessageDisplay;
messageDisplay = GameObject.Find(MessageDisplay.SCRIPT_HOST).GetComponent(MessageDisplay);
*/
/*
	Example of a message that can be called

	messageDisplay.addMessage("Click on the button below the Unity Web Player to import a model!\n"+
									"(Please pick the .obj file along with the .mtl file and all the texture files if nessecary.");

*/

function Start () {
	uiAccessor = gameObject.GetComponent(UIControl);
	// Initialize the GUI Content arrays for the median, traffic and curbside buttons 
	medianButtons = new GUIContent [medianStrings.length];
	for (var i = 0 ; i < medianStrings.length; i++){
		medianButtons[i] = new GUIContent(medianImages[i], medianStrings[i]);
	}
	trafficButtons = new GUIContent [trafficStrings.length];
	for (i = 0 ; i < trafficStrings.length; i++){
		trafficButtons[i] = new GUIContent(trafficImages[i], trafficStrings[i]);
	}
	curbsideButtons = new GUIContent [curbsideStrings.length];
	for (i = 0 ; i < curbsideStrings.length; i++){
		curbsideButtons[i] = new GUIContent(curbsideImages[i], curbsideStrings[i]);
	}
}

function OnEnable(){
	menuEnabled = false;
}

function Update () {
	if(!menuEnabled && roadSegmentObject == null){
		instructionMsg = "Please click on a road segment to make changes to its street layout";
	}
	if (Input.GetMouseButtonDown(0)){
		var ray = Camera.main.ScreenPointToRay(Input.mousePosition);
		var hit : RaycastHit;
		// Performs the Raycast and retrieve the info from the RoadSegment object if the menu is disabled (ie. no road segment is clicked)
		if (!menuEnabled && Physics.Raycast(ray, hit, range)){
			if(hit.transform.gameObject.name.Contains("INTERSECTION")) {
				var intersectionInfo = hit.transform.gameObject.GetComponent(InstantiateIntersections);
				Debug.Log("RightOfWayUI log : Intersection selected = " + intersectionInfo.unityName);
				/*for(var num = 0; num < intersectionInfo.intersectionStreets.length; num++) {
					Debug.Log("RightOfWayUI log : intersection street = " + intersectionInfo.intersectionStreets[num]);
				}
				for( num = 0; num < intersectionInfo.intersectionStreetsUnityName.length; num++) {
					Debug.Log("RightOfWayUI log : intersectionStreetsUnityName = " + intersectionInfo.intersectionStreetsUnityName[num]);
				}*/
			}
			if (hit.transform.gameObject.name.Contains("ROAD") || hit.transform.tag == "median" || hit.transform.tag == "curbside" || hit.transform.tag == "traffic") {
				// To enhance the user experience, if the hit object is a median, a curbside element and a traffic element, the corresponding roadSegment GameObject
				// is referred
				if(hit.transform.tag == "median" || hit.transform.tag == "curbside" || hit.transform.tag == "traffic") {
					// the first parent is the objectHolder, the second one is the roadSegment GameObject
					// More details in InstantiateRoadElements.js function CreateRoadElement()
					roadSegmentObject = hit.transform.parent.parent.gameObject;
				} else {
					roadSegmentObject = hit.transform.gameObject;
				}
				// Each roadSegment GameObject has a script InstantiateRoadElements with their corresponding variables
				// Here we make a copy of the variables from the InstantiateRoadElements script
				roadSegmentInfo = roadSegmentObject.GetComponent(InstantiateRoadElements);
				unityName = roadSegmentInfo.unityName;
				roadWidth = roadSegmentInfo.roadWidth;
				roadName = roadSegmentInfo.streetName;
				roadType = roadSegmentInfo.streetClass;
				
				isOneWay = roadSegmentInfo.isOneWay;
				numSegmentsLeft = roadSegmentInfo.numSegmentsLeft;
				numSegmentsRight = roadSegmentInfo.numSegmentsRight;
				leftTypes = new String[numSegmentsLeft];
				leftWidths = new float[numSegmentsLeft];
				rightTypes = new String[numSegmentsRight];
				rightWidths = new float[numSegmentsRight];
				tempSliderLeft = numSegmentsLeft;
				tempSliderRight = numSegmentsRight;
				numSegmentsLeftTextbox = numSegmentsLeft.ToString();
				numSegmentsRightTextbox = numSegmentsRight.ToString();

				for(var i = 0; i < numSegmentsLeft; i++) {
					leftTypes[i] = roadSegmentInfo.leftTypes[i];
					leftWidths[i] = roadSegmentInfo.leftWidths[i];
				}
				for(i = 0; i < numSegmentsRight; i++) {
					rightTypes[i] = roadSegmentInfo.rightTypes[i];
					rightWidths[i] = roadSegmentInfo.rightWidths[i];
				}
				medianType = roadSegmentInfo.medianType;
				medianWidth = roadSegmentInfo.medianWidth;

				UpdateOffsets();

				// Find the road segments in the same block and intersections attached to them
				var tempInfo : String[] = gameObject.Find("Road Segments").GetComponent(CreateAllRoads).FindSegmentsInSameBlock(unityName).Split("&"[0]);
				//Debug.Log("RightOfWayUI log : tempInfo[0] :" + tempInfo[0]);
				//Debug.Log("RightOfWayUI log : tempInfo[1] :" + tempInfo[1]);
				unityNamesArray = tempInfo[0].Split(","[0]);
				intersectionNamesArray = tempInfo[1].Split(";"[0]);
				if(unityNamesArray[0] != "") {
					/*for(i = 0; i < unityNamesArray.length; i++) {
						Debug.Log("RightOfWayUI log : unityNamesArray["+i+"] = " + unityNamesArray[i]);
					}*/
					multipleSegments = true;
				} else {
					multipleSegments = false;
				}
				Debug.Log("RightOfWayUI log : Selected road segment unityName = " + unityName);
				Debug.Log("RightOfWayUI log : Selected road segment is initialized = " + roadSegmentInfo.initialized);
				/*
					Debug.Log("RightOfWayUI log : isOneWay = " + roadSegmentInfo.isOneWay);
					Debug.Log("RightOfWayUI log : numSegmentsLeft = " + roadSegmentInfo.numSegmentsLeft);
					Debug.Log("RightOfWayUI log : numSegmentsRight = " + roadSegmentInfo.numSegmentsRight);
					for(i=0; i<leftTypes.length; i++) {
						Debug.Log("RightOfWayUI log : leftTypes["+i+"] = " + roadSegmentInfo.leftTypes[i]);
					}
					for(i=0; i<rightTypes.length; i++) {
						Debug.Log("RightOfWayUI log : rightTypes["+i+"] = " + roadSegmentInfo.rightTypes[i]);
					}
					for(i=0; i<currOffset.length; i++) {
						Debug.Log("RightOfWayUI log : currOffset["+i+"] = " + currOffset[i]);
					}
					Debug.Log("RightOfWayUI log : initialized = " + roadSegmentInfo.initialized);
					Debug.Log("RightOfWayUI log : medianWidth = " + roadSegmentInfo.medianWidth);
					Debug.Log("RightOfWayUI log : medianType = " + roadSegmentInfo.medianType);

					for(i = 0; i < unityNamesArray.length; i++) {
						Debug.Log("RightOfWayUI log : unityNamesArray["+i+"] = " + unityNamesArray[i]);
					}
				*/
				/*
					Debug.Log("RightOfWayUI log : unityName = " + roadSegmentInfo.unityName);
					Debug.Log("RightOfWayUI log : wardNum = " + roadSegmentInfo.wardNum);
					Debug.Log("RightOfWayUI log : objectType = " + roadSegmentInfo.objectType);
					Debug.Log("RightOfWayUI log : roadPIN = " + roadSegmentInfo.roadPIN);
					Debug.Log("RightOfWayUI log : arcMap_XCoord = " + roadSegmentInfo.arcMap_XCoord);
					Debug.Log("RightOfWayUI log : arcMap_YCoord = " + roadSegmentInfo.arcMap_YCoord);
					Debug.Log("RightOfWayUI log : roadWidth = " + roadSegmentInfo.roadWidth);

					Debug.Log("RightOfWayUI log : connectionStart = " + roadSegmentInfo.connectionStart);
					Debug.Log("RightOfWayUI log : connectionEnd = " + roadSegmentInfo.connectionEnd);
					Debug.Log("RightOfWayUI log : streetName = " + roadSegmentInfo.streetName);
					Debug.Log("RightOfWayUI log : streetClass = " + roadSegmentInfo.streetClass);
					Debug.Log("RightOfWayUI log : jurisdiction = " + roadSegmentInfo.jurisdiction);

					Debug.Log("RightOfWayUI log : toStreet = " + roadSegmentInfo.toStreet);
					Debug.Log("RightOfWayUI log : fromStreet = " + roadSegmentInfo.fromStreet);
				*/
				Debug.Log("RightOfWayUI log : -----------------");
				
				if(roadSegmentInfo.initialized){
					spaceConfigured = true;
					unredoList = gameObject.Find("DataHandler").GetComponent(UserDataBackend).ReturnListOfPreviousRoadsChanges(unityName,numRowsOfUnredoList);
					if (unredoList != null) {
						listPointer = unredoList.length - 2;
						//Debug.Log("RightOfWayUI log : unredoList.length = " + unredoList.length);
						//Debug.Log("RightOfWayUI log : unredoList listPointer = " + listPointer);
					} else {
						Debug.Log("RightOfWayUI log : unredo list is null");
					}
				}
				instructionMsg = "";
				menuEnabled = true;
			}
		}
	}
}

function OnGUI(){

	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	if(menuEnabled && !spaceConfigured){
		instructionMsg = (roadSegmentInfo.initialized) ? "" : "Please initialize the street layout to proceed";
	}

	GUILayout.BeginArea(new Rect(10,10 , rightOfWayEditorWidth, 50),"", "BlueFolderTop");
		GUILayout.BeginVertical();
			GUILayout.Space(23);
			GUILayout.BeginHorizontal();
				GUILayout.Space(45);
				GUILayout.Label("RIGHT-OF-WAY EDITOR", "Title", GUILayout.Height(35), GUILayout.Width(200));
				GUILayout.Space(45);
				GUILayout.Label(InstructionMessage(instructionMsg), InstructionMessageType(instructionMsg), GUILayout.Height(30), GUILayout.Width(700));
				GUILayout.FlexibleSpace();
				if (previewMode) {
					if(GUILayout.Button("", "previewCheckMark", GUILayout.Width(25), GUILayout.Height(25))){
						menuEnabled = true;
						previewMode = false;
						instructionMsg = "";
					}
					GUILayout.Space(25);
				} else {
					if(GUILayout.Button("", "minimize", GUILayout.Width(25), GUILayout.Height(25))) {
						menuEnabled = false;
						previewMode = true;
						instructionMsg = "";
					}
					GUILayout.Space(25);
				}
				if (GUILayout.Button("", "close", GUILayout.Width(25), GUILayout.Height(25))){
					//roadSegmentInfo.initialized is true indicates that there must at least be one entry in the localized change list
					if(roadSegmentInfo != null && roadSegmentInfo.initialized == true) {
						if (changesMade == true) {
							Debug.Log("RightOfWayUI log : Changes made not saved yet.. Reverting changes..");
							var lastChange : String = gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveLastRoadChange(unityName);
							if(lastChange == null) lastChange = gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveFirstRoadChange(unityName);
							gameObject.Find("/AvatarHandler").GetComponent(AvatarManager).DestroySidewalkPedestrian(unityName);
							gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(lastChange,true);
							RedrawIntersectionSidewalk(intersectionNamesArray);
							if(multipleSegments) {
								for(var i = 0; i < unityNamesArray.length; i++) {
									lastChange = gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveLastRoadChange(unityNamesArray[i]);
									if(lastChange == null) lastChange = gameObject.Find("DataHandler").GetComponent(UserDataBackend).RetrieveFirstRoadChange(unityName);
									gameObject.Find("/AvatarHandler").GetComponent(AvatarManager).DestroySidewalkPedestrian(unityNamesArray[i]);
									gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(lastChange,true);
									var tempVar : String[] = GameObject.Find("Road Segments").GetComponent(CreateAllRoads).FindSegmentsInSameBlock(unityName).Split("&"[0]);
									var tempIntersections : String[] = tempVar[1].Split(";"[0]);
									RedrawIntersectionSidewalk(tempIntersections);
								}
							}
						}
					}
					changesMade = false;
					instructionMsg = "";
					previewMode = false;
					multipleSegments = false;
					roadSegmentObject = null;
					closeProcedure();
				}
				GUILayout.Space(25);
			GUILayout.EndHorizontal();	
		GUILayout.EndVertical();
		
	GUILayout.EndArea();
	if (menuEnabled){
		GUILayout.BeginArea(new Rect(10, 60, rightOfWayEditorWidth, 350),"", "BlueFolder");

		GUILayout.Space(10);
		GUILayout.BeginVertical();
			GUILayout.BeginHorizontal();
				GUILayout.Space(50);
				GUILayout.Label("Street Name:  " + roadName, "text3", GUILayout.Height(25));
				GUILayout.FlexibleSpace();
				GUILayout.Label("Street Type:  " + pattern.Replace(roadType.ToString(),"$1 $2"), "text3", GUILayout.Height(25)); // Since roadType is a streetClassType which is an enum, the Default value would be CityRoad
				GUILayout.FlexibleSpace();
				GUILayout.Label("Road Width:  " + roadWidth + " m", "text3", GUILayout.Height(25));
				GUILayout.Space(50);
			GUILayout.EndHorizontal();
			GUILayout.Space(5);
		GUILayout.EndVertical();
			
		GUILayout.BeginVertical();
			GUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				GUILayout.BeginVertical();
					//Stupid Quick Fix that needs to be changed after finishing the prototype: to convert the whole function using GUI
					GUILayoutUtility.GetRect(950,200);
					GUILayout.BeginArea(new Rect(10+(rightOfWayEditorWidth-950)/2, 10+25+35+25 - 50,950,200), "CURRENT CROSS-SECTION", "crossSection");
						GUILayout.FlexibleSpace();
						GUILayout.BeginHorizontal();
							GUILayout.FlexibleSpace();
							// Draw the cross Section only if the space has been configured through the Street Configuration 
							if (spaceConfigured){
								DrawOnCrossSection(roadWidth);
							}
							GUILayout.FlexibleSpace();
						GUILayout.EndHorizontal();
					GUILayout.EndArea();
				GUILayout.EndVertical();
				GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
		GUILayout.EndVertical(); 

		GUILayout.Space(10);

		GUILayout.BeginVertical();
			GUILayout.BeginHorizontal();
				GUILayout.BeginHorizontal(GUILayout.Width(rightOfWayEditorWidth/2),GUILayout.Height(61));
					GUILayout.Space(100);
					var activeViewTemp : ScreenView;
					activeViewTemp = GUILayout.SelectionGrid(activeView, ["LANE\nCREATOR", "MEDIAN\nEDITOR", "CURBSIDE\nEDITOR", "VEHICLE LANE\nEDITOR"],4,"menuTitle", GUILayout.Height(61));
					if(activeViewTemp != activeView) ResetTickerTimer();
					GUILayout.Space(100);
				GUILayout.EndHorizontal();

				GUILayout.BeginHorizontal(GUILayout.Width(rightOfWayEditorWidth/2),GUILayout.Height(61));
					GUILayout.Space(100);
						var pedestrianButton;
						if (!pedestrianDisabled) {
							pedestrianButton = GUILayout.Button("PEDESTRIAN","buttonGreenIndicator", GUILayout.Height(61));
						} else {
							pedestrianButton = GUILayout.Button("PEDESTRIAN","FunctionsButton", GUILayout.Height(61));
						}
						if(pedestrianButton) {
							pedestrianDisabled = !pedestrianDisabled;
							if(!pedestrianDisabled) {
								Debug.Log("RightOfWayUI log : Pedestrian Enabled");
								instructionMsg = "Pedestrian Enabled";
								GameObject.Find("/AvatarHandler").GetComponent(AvatarManager).ResumePedestrian();
							} else {
								Debug.Log("RightOfWayUI log : Pedestrian Disabled");
								instructionMsg = "Pedestrian Disabled";
								GameObject.Find("/AvatarHandler").GetComponent(AvatarManager).DeactivatePedestrian();
							}
						}
						var undoButton = GUILayout.Button("UNDO","FunctionsButton", GUILayout.Height(61));
						/*
							if (listPointer >= 0 && roadSegmentInfo.initialized) {
								undoButton = GUILayout.Button("UNDO","buttonGreenIndicator", GUILayout.Height(61));
							} else {
								undoButton = GUILayout.Button("UNDO","FunctionsButton", GUILayout.Height(61));
							}
						*/
						if(undoButton){
							Debug.Log("RightOfWayUI log : Undo");
							if(unredoList != null && listPointer >= 0) {
								gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).LoadRoadSegment(unredoList[listPointer],false);
								roadSegmentInfo = roadSegmentObject.GetComponent(InstantiateRoadElements);

								isOneWay = roadSegmentInfo.isOneWay;
								numSegmentsLeft = roadSegmentInfo.numSegmentsLeft;
								numSegmentsRight = roadSegmentInfo.numSegmentsRight;
								tempSliderLeft = numSegmentsLeft;
								numSegmentsLeftTextbox = numSegmentsLeft.ToString();
								tempSliderRight = numSegmentsRight;
								numSegmentsRightTextbox = numSegmentsRight.ToString();
								leftTypes = new String[numSegmentsLeft];
								leftWidths = new float[numSegmentsLeft];
								rightTypes = new String[numSegmentsRight];
								rightWidths = new float[numSegmentsRight];

								for(i = 0; i < numSegmentsLeft; i++) {
									leftTypes[i] = roadSegmentInfo.leftTypes[i];
									leftWidths[i] = roadSegmentInfo.leftWidths[i];
								}
								for(i = 0; i < numSegmentsRight; i++) {
									rightTypes[i] = roadSegmentInfo.rightTypes[i];
									rightWidths[i] = roadSegmentInfo.rightWidths[i];
								}
								medianType = roadSegmentInfo.medianType;
								medianWidth = roadSegmentInfo.medianWidth;

								UpdateOffsets();

								listPointer--;
								changesMade = true;
								//Debug.Log("RightOfWayUI log : Undo executed");
							}
						}
						if(GUILayout.Button("RESTORE\nDEFAULT","FunctionsButton", GUILayout.Height(61))){
							Debug.Log("RightOfWayUI log : Restore Default");
							if(!gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).RestoreDefaultRoad(false, roadWidth, roadSegmentObject,true, roadSegmentInfo.wardNum.ToString())) {
								roadSegmentObject.GetComponent(InstantiateRoadElements).initialized = false;
							}
							var roadSegmentObjectInSameBlock : GameObject;
							if(multipleSegments) {
								for(i = 0; i < unityNamesArray.length; i++) {
									roadSegmentObjectInSameBlock = GameObject.Find("Road Segments/"+unityNamesArray[i]);
									var roadWidthInSameBlock : float = parseFloat(unityNamesArray[i].Split("_"[0])[5]);
									if(!gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).RestoreDefaultRoad(false, roadWidthInSameBlock, roadSegmentObjectInSameBlock,true, roadSegmentInfo.wardNum.ToString())) {
										roadSegmentObjectInSameBlock.GetComponent(InstantiateRoadElements).initialized = false;
									}
								}
							}
							unredoList = gameObject.Find("DataHandler").GetComponent(UserDataBackend).ReturnListOfPreviousRoadsChanges(unityName,numRowsOfUnredoList);
							if (unredoList != null) {
								listPointer = unredoList.length - 2;
							}
							if(!roadSegmentObject.GetComponent(InstantiateRoadElements).initialized) {
								spaceConfigured = false;
							}
							changesMade = true;
						}
						/*
							var previewButton;
							if (changesMade && roadSegmentInfo.initialized) {
								previewButton = GUILayout.Button("PREVIEW","buttonGreenIndicator", GUILayout.Height(61));
							} else {
								previewButton = GUILayout.Button("PREVIEW","FunctionsButton", GUILayout.Height(61));
							}
							if(previewButton){
								Debug.Log("RightOfWayUI log : Preview Mode");
								instructionMsg = "Preview Mode";
								previewMode = true;
								menuEnabled = false;
							}
						*/
						if(GUILayout.Button("APPLY\nCHANGES","FunctionsButton", GUILayout.Height(61))){
							Debug.Log("RightOfWayUI log : Save Changes");
							UpdateLocalChange();
							gameObject.Find("DataHandler").GetComponent(UserDataBackend).AddChanges(unityName);
							if(multipleSegments) {
								for(var m = 0; m < unityNamesArray.length ; m++) {
									gameObject.Find("DataHandler").GetComponent(UserDataBackend).AddChanges(unityNamesArray[m]);
								}
							}
							spaceConfigured = true;
							roadSegmentInfo = roadSegmentObject.GetComponent(InstantiateRoadElements);
							roadSegmentInfo.initialized = true;
							unredoList = gameObject.Find("DataHandler").GetComponent(UserDataBackend).ReturnListOfPreviousRoadsChanges(unityName,numRowsOfUnredoList);
							if (unredoList != null) {
								listPointer = unredoList.length - 2;
							}
							changesMade = false;
						}
					GUILayout.Space(100);
				GUILayout.EndHorizontal();
			GUILayout.EndHorizontal();
		GUILayout.EndVertical();
		GUILayout.EndArea();
	}

	if (menuEnabled){
		if (!spaceConfigured) activeViewTemp = ScreenView.StreetConfiguration;
		if (activeView != activeViewTemp) {
				defaultViewChanged = true;
		}
		if (activeViewTemp == ScreenView.StreetConfiguration){
			StreetConfigurationMenu();
		} else if (activeViewTemp == ScreenView.MedianZone){
			MedianZoneMenu();
		} else if (activeViewTemp == ScreenView.CurbsideZone){
			CurbsideZoneMenu();
		} else if (activeViewTemp == ScreenView.TrafficZone){
			TrafficZoneMenu();
		}
		defaultViewChanged = false;
		activeView = activeViewTemp;
	}
}

private function StreetConfigurationMenu(){
	GUILayout.BeginArea(new Rect(10,410,rightOfWayEditorWidth/2,dropDownMenuHeight), "", "DropDownMenuBlue");
		GUILayout.Space(5);
		GUILayout.Label("DIRECTIONALITY");
		GUILayout.Space(5);
		var tempValue: Boolean = isOneWay;
		tempValue = GUILayout.Toggle(tempValue, "	ONE-WAY");
		tempValue = !GUILayout.Toggle(!tempValue, "    TWO-WAY");
		if (tempValue != isOneWay) {
			if(tempValue && numSegmentsLeft < 3) {
				numSegmentsLeft = 3;
				leftTypes = new String[3];
				leftWidths = new float[3];
				//Debug.Log("RightOfWayUI log : numSegmentsLeft changes");
			}
			for(var i=0 ; i < numSegmentsLeft; i++){
				if (tempValue) { // from two ways to one way; use the left sides element to populate the entire road width
					leftTypes[i] = ( i == 0 || i == numSegmentsLeft - 1) ? "Sidewalk" : "Car";
					leftWidths[i] = ( i == 0 || i == numSegmentsLeft - 1) ? 1.5 : Mathf.Round((roadWidth - 3)/(numSegmentsLeft - 2)*100)/100;
				} else { // from one way to two ways
					leftTypes[i] = ( i == 0) ? "Sidewalk" : "Car";
					var sumOfRightWidths : float = 0;
					for(var j=0; j < numSegmentsRight; j++) {
						sumOfRightWidths += rightWidths[j];
					}
					leftWidths[i] = ( i == 0 ) ? 1.5 : Mathf.Round((roadWidth - sumOfRightWidths - medianWidth - 1.5)*100/(numSegmentsLeft-1))/100;
				}
			}
			if(roadSegmentInfo.initialized) {
				isOneWay = tempValue; // this is necessary because UpdateLocalChange needs the correct isOneWay value
				UpdateLocalChange();
			}
		}
		isOneWay = tempValue;

		GUILayout.Box("", "dottedline", GUILayout.Width(360), GUILayout.Height(6));
		if (isOneWay){
			GUILayout.FlexibleSpace();
			
			GUILayout.BeginHorizontal();
				GUILayout.Label("Number of Lanes :" + numSegmentsLeft);
				GUILayout.FlexibleSpace();
				if (numSegmentsLeftTextbox == null) numSegmentsLeftTextbox = numSegmentsLeft.ToString();
				tempLeftTextbox = GUILayout.TextField(numSegmentsLeftTextbox, "segmentTextbox", GUILayout.Width(97), GUILayout.Height(35));			
				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp)){
					if (int.TryParse(tempLeftTextbox,numSegmentsLeftTemp)) {
						numSegmentsLeftTemp = Mathf.Round(numSegmentsLeftTemp);
						if (numSegmentsLeftTemp <=5 && numSegmentsLeftTemp >= 2) {
							numSegmentsLeftTextbox = numSegmentsLeftTemp.ToString();
							tempSliderLeft = numSegmentsLeftTemp;
							instructionMsg = "";
						} else {
							//Debug.Log("Error: Number of Lanes out of range");
							instructionMsg = "Error: Number of Lanes out of range";
							numSegmentsLeftTextbox = numSegmentsLeft.ToString();
						}
					} else {
						//Debug.Log("Error: Please Enter a numerical value between 2 and 5");
						instructionMsg = "Error: Please Enter a numerical value between 2 and 5";
						numSegmentsLeftTextbox = numSegmentsLeft.ToString();
					}
				} else {
					numSegmentsLeftTextbox = tempLeftTextbox;
				}
				GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();

			GUILayout.FlexibleSpace();
		} else {
			GUILayout.FlexibleSpace();
			
			GUILayout.BeginHorizontal();
				GUILayout.Label("LEFT SIDE : Number of Lanes " + numSegmentsLeft);
				GUILayout.FlexibleSpace();
				if (numSegmentsLeftTextbox == null) numSegmentsLeftTextbox = numSegmentsLeft.ToString();
				tempLeftTextbox = GUILayout.TextField(numSegmentsLeftTextbox, "segmentTextbox", GUILayout.Width(97), GUILayout.Height(35));			
				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp)){
					if (int.TryParse(tempLeftTextbox,numSegmentsLeftTemp)) {
						numSegmentsLeftTemp = Mathf.Round(numSegmentsLeftTemp);
						if (numSegmentsLeftTemp <=5 && numSegmentsLeftTemp >= 2) {
							numSegmentsLeftTextbox = numSegmentsLeftTemp.ToString();
							tempSliderLeft = numSegmentsLeftTemp;
						} else {
							//Debug.Log("Error: Number of Lanes out of range");
							instructionMsg = "Error: Number of Lanes out of range";
							numSegmentsLeftTextbox = numSegmentsLeft.ToString();
						}
					} else {
						//Debug.Log("Error: Please Enter a numerical value between 2 and 5");
						instructionMsg = "Error: Please Enter a numerical value between 2 and 5";
						numSegmentsLeftTextbox = numSegmentsLeft.ToString();
					}
				} else {
					numSegmentsLeftTextbox = tempLeftTextbox;
				}
				GUILayout.Space(20);
			GUILayout.EndHorizontal();

			GUILayout.FlexibleSpace();
			
			GUILayout.BeginHorizontal();
				GUILayout.Label("RIGHT SIDE : Number of Lanes " + numSegmentsRight);

				GUILayout.FlexibleSpace();
				if (numSegmentsRightTextbox == null) numSegmentsRightTextbox = numSegmentsRight.ToString();
				tempRightTextbox = GUILayout.TextField(numSegmentsRightTextbox, "segmentTextbox", GUILayout.Width(97), GUILayout.Height(35));			
				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp)){
					if (int.TryParse(tempRightTextbox,numSegmentsRightTemp)) {
						numSegmentsRightTemp = Mathf.Round(numSegmentsRightTemp);
						if (numSegmentsRightTemp <=5 && numSegmentsRightTemp >= 2) {
							numSegmentsRightTextbox = numSegmentsRightTemp.ToString();
							tempSliderRight = numSegmentsRightTemp;
						} else {
							//Debug.Log("Error: Number of Lanes out of range");
							instructionMsg = "Error: Number of Lanes out of range";
							numSegmentsRightTextbox = numSegmentsRight.ToString();
						}
					} else {
						//Debug.Log("Error: Please Enter a numerical value between 2 and 5");
						instructionMsg = "Error: Please Enter a numerical value between 2 and 5";
						numSegmentsRightTextbox = numSegmentsRight.ToString();
					}
				} else {
					numSegmentsRightTextbox = tempRightTextbox;
				}
				GUILayout.Space(20);
			GUILayout.EndHorizontal();
			
			GUILayout.FlexibleSpace();
		}

		var remainingLeftWidth : float;
		var remainingRightWidth : float;
		var estimateWidth : float = 0;
		var tempLeftTypes : String[] = new String[tempSliderLeft];
		var tempLeftWidths : float[] = new float[tempSliderLeft];
		var tempRightTypes : String[] = new String[tempSliderRight];
		var tempRightWidths : float[] = new float[tempSliderRight];

		if (isOneWay) {
			remainingLeftWidth = roadWidth;
		} else {
			if (tempSliderLeft != numSegmentsLeft) {
				remainingLeftWidth = currOffset[numSegmentsLeft];
			}
			if (tempSliderRight != numSegmentsRight) {
				remainingRightWidth = roadWidth - currOffset[numSegmentsLeft+1];
			}
		}

		var leftLaneError : Boolean = false;

		if (tempSliderLeft > numSegmentsLeft) {
			for(i = 0; i < tempLeftTypes.length; i++) {
				if (isOneWay) {
					if(i == 0 || i == tempLeftTypes.length-1) {
						tempLeftTypes[i] = "Sidewalk";
						estimateWidth += ReturnMinWidth("Sidewalk");
					} else {
						if ( ReturnLaneTypeColor(leftTypes[i]) == "Red Rect") {
							tempLeftTypes[i] = leftTypes[i];
							estimateWidth += ReturnMinWidth(leftTypes[i]);
						} else {
							tempLeftTypes[i] = "Car";
							estimateWidth += ReturnMinWidth("Car");
						}
					}
				} else {
					if(i < numSegmentsLeft) {
						tempLeftTypes[i] = leftTypes[i];
						estimateWidth += ReturnMinWidth(leftTypes[i]);
					} else {
						tempLeftTypes[i] = "Car";
						estimateWidth += ReturnMinWidth("Car");
					}
				}
			}
			if(estimateWidth > remainingLeftWidth) {
				tempSliderLeft = numSegmentsLeft;
				numSegmentsLeftTextbox = numSegmentsLeft.ToString();
				//Debug.Log("Error: Not enough space for another lane on the left side");
				instructionMsg = "Error: Not enough space for another lane on the left side";
				leftLaneError = true;
			} else {
				if (isOneWay) {
					tempLeftWidths[0] = ReturnMinWidth(tempLeftTypes[0]);
					remainingLeftWidth -= tempLeftWidths[0];
					tempLeftWidths[tempLeftWidths.length-1] = ReturnMinWidth(tempLeftTypes[tempLeftTypes.length-1]);
					remainingLeftWidth -= tempLeftWidths[tempLeftWidths.length-1];
					for(i = 1; i < tempLeftWidths.length-1; i++) {
						if (i == tempLeftWidths.length-2) {
							tempLeftWidths[i] = remainingLeftWidth;
						} else {
							tempLeftWidths[i] = ReturnMinWidth(tempLeftTypes[i]);
							remainingLeftWidth -= tempLeftWidths[i];
						}
					}
				} else {
					for(i = 0; i < tempLeftWidths.length; i++) {
						if ( i == tempLeftWidths.length - 1){
							tempLeftWidths[i] = remainingLeftWidth;
						} else {
							tempLeftWidths[i] = ReturnMinWidth(tempLeftTypes[i]);
							remainingLeftWidth -= tempLeftWidths[i];
						}
					}
				}
				leftTypes = tempLeftTypes;
				leftWidths = tempLeftWidths;
				numSegmentsLeftTextbox = tempSliderLeft.ToString();
				changesMade = true;
				instructionMsg = "";
			}
		}

		estimateWidth = 0;

		if (tempSliderRight > numSegmentsRight) {
			for(i = 0; i < tempRightTypes.length; i++) {
				if(i < numSegmentsRight) {
					tempRightTypes[i] = rightTypes[i];
					estimateWidth += ReturnMinWidth(rightTypes[i]);
				} else {
					tempRightTypes[i] = "Car";
					estimateWidth += ReturnMinWidth("Car");
				}
			}
			if(estimateWidth > remainingRightWidth) {
				tempSliderRight = numSegmentsRight;
				numSegmentsRightTextbox = numSegmentsRight.ToString();
				//Debug.Log("Error: Not enough space for another lane on the left and right side");
				if(leftLaneError) instructionMsg = "Error: Not enough space for another lane on the left and right side";
				else instructionMsg = "Error: Not enough space for another lane on the right side";
			} else {
				for(i = 0; i < tempRightWidths.length; i++) {
					if ( i == tempRightWidths.length - 1){
						tempRightWidths[i] = remainingRightWidth;
					} else {
						tempRightWidths[i] = ReturnMinWidth(tempRightTypes[i]);
						remainingRightWidth -= tempRightWidths[i];
					}
				}
				rightTypes = tempRightTypes;
				rightWidths = tempRightWidths;
				numSegmentsRightTextbox = tempSliderRight.ToString();
				changesMade = true;
				instructionMsg = "";
			}
		}

		if (tempSliderLeft < numSegmentsLeft) {
			if (isOneWay) {
				if (tempSliderLeft == 2) {
					tempLeftTypes[0] = "Sidewalk";
					tempLeftTypes[1] = "Car";
					tempLeftWidths[0] = ReturnMinWidth("Sidewalk");
					tempLeftWidths[1] = remainingLeftWidth - ReturnMinWidth("Sidewalk");
				} else {
					tempLeftTypes[0] = leftTypes[0];
					tempLeftWidths[0] = leftWidths[0];
					remainingLeftWidth -= leftWidths[0];
					if(ReturnLaneTypeColor(leftTypes[leftTypes.length-1]) == "Green Rect" || ReturnLaneTypeColor(leftTypes[leftTypes.length-1]) == "Blue Rect") {
						tempLeftTypes[tempLeftTypes.length-1] = leftTypes[leftTypes.length-1];
						tempLeftWidths[tempLeftWidths.length-1] = leftWidths[leftWidths.length-1];
						remainingLeftWidth -= leftWidths[leftWidths.length-1];
					} else {
						tempLeftTypes[tempLeftTypes.length-1] = "Sidewalk";
						tempLeftWidths[tempLeftWidths.length-1] = ReturnMinWidth("Sidewalk");
						remainingLeftWidth -= ReturnMinWidth("Sidewalk");
					}
					for(i = 1; i < tempLeftTypes.length-1; i++) {
						tempLeftTypes[i] = leftTypes[i];
						if(i == tempLeftTypes.length-2) {
							tempLeftWidths[i] = remainingLeftWidth;
						} else {
							tempLeftWidths[i] = leftWidths[i];
							remainingLeftWidth -= leftWidths[i];
						}
					}
				}
			} else {
				for(i = 0; i < tempLeftTypes.length; i++) {
					tempLeftTypes[i] = leftTypes[i];
					if(i == tempLeftTypes.length -1) {
						tempLeftWidths[i] = remainingLeftWidth;
					} else {
						tempLeftWidths[i] = leftWidths[i];
						remainingLeftWidth -= leftWidths[i];
					}
				}
			}
			leftTypes = tempLeftTypes;
			leftWidths = tempLeftWidths;
			numSegmentsLeftTextbox = tempSliderLeft.ToString();
			changesMade = true;
			instructionMsg = "";
		}

		if (tempSliderRight < numSegmentsRight) {
			for(i = 0; i < tempRightTypes.length; i++) {
				tempRightTypes[i] = rightTypes[i];
				if(i == tempRightTypes.length -1) {
					tempRightWidths[i] = remainingRightWidth;
				} else {
					tempRightWidths[i] = rightWidths[i];
					remainingRightWidth -= rightWidths[i];
				}
			}
			rightTypes = tempRightTypes;
			rightWidths = tempRightWidths;
			numSegmentsRightTextbox = tempSliderRight.ToString();
			changesMade = true;
			instructionMsg = "";
		}

		numSegmentsLeft = tempSliderLeft;
		numSegmentsRight = tempSliderRight;

		UpdateOffsets();

	GUILayout.EndArea();
}

private function MedianZoneMenu(){
	GUILayout.BeginArea(new Rect(10,410,rightOfWayEditorWidth/2,dropDownMenuHeight), "", "DropDownMenuBlue");
		var medianSelectedTemp : int;
		if (!isOneWay){
			GUILayout.Space(7);
			
			GUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				medianSelectedTemp = GUILayout.SelectionGrid(medianSelected, medianButtons,4, GUILayout.Width(380), GUILayout.Height(150));
				medianMin = medianMinimums[medianSelectedTemp];
				medianMax = roadWidth;
				GUILayout.FlexibleSpace();
			GUILayout.EndHorizontal();
			
			GUILayout.BeginHorizontal();
				GUILayout.FlexibleSpace();
				GUILayout.BeginVertical();
					GUILayout.Label(medianStrings[medianSelectedTemp], "text2", GUILayout.Height(25));
					if(CheckTicker()) {
						GUILayout.Label("Minimum Width: " + medianMin + " m", "redtext", GUILayout.Height(17));
					} else {
						GUILayout.Label("Minimum Width: " + medianMin + " m", "text", GUILayout.Height(17));
					}
					GUILayout.Label("Maximum Width: " + medianMax + " m", "text", GUILayout.Height(17));
				GUILayout.EndVertical();
				GUILayout.Space(10);
				GUILayout.BeginVertical();
					if (medianWidthTextbox == null) medianWidthTextbox = medianMin.ToString();
					tempTextbox = GUILayout.TextField(medianWidthTextbox, "textbox", GUILayout.Width(97), GUILayout.Height(39));		
					if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp) || medianSelectedTemp != medianSelected || defaultViewChanged){
						if (!(ReturnLaneTypeColor(ReturnSelectedInfo(currPos,"Type")) == "Yellow Rect")) {
							//Debug.Log("Error: Only Median Zone Element is allowed in Median Zone");
							instructionMsg = "Error: Only Median Zone Element is allowed in Median Zone";
							medianWidthTextbox = tempTextbox;
						} else {
							if (float.TryParse(tempTextbox, medianWidthTemp)){
								medianWidthTemp = Mathf.Round(medianWidthTemp*100)/100;
								if (medianWidthTemp < medianMin) {
									medianWidthTemp = medianMin;
								}
								else if (medianWidthTemp > medianMax ){
									medianWidthTemp = medianMax;
								}
								if(EditSegment(currPos, medianStrings[medianSelectedTemp], medianWidthTemp)) {
									//Debug.Log("RightOfWayUI log : Update Completed");
									changesMade = true;
									medianWidthTextbox = medianWidthTemp.ToString();
									medianWidthSlider = medianWidthTemp;
									UpdateLocalChange();
								} else {
									//Debug.Log("RightOfWayUI log : Cannot update!");
									medianWidthTextbox = ReturnSelectedInfo(currPos,"Width").ToString();
									medianWidthSlider = ReturnSelectedInfo(currPos,"Width");
								}			
							} else {
								//Debug.Log("Error: Textbox input is not a numerical value");
								instructionMsg = "Error: Textbox input is not a numerical value";
							}
						}
					} else {
						medianWidthTextbox = tempTextbox;
					}
				GUILayout.EndVertical();
				GUILayout.Space(10);
			GUILayout.EndHorizontal();
			medianSelected = medianSelectedTemp;
		}
	GUILayout.EndArea();
}	

private function CurbsideZoneMenu(){
	GUILayout.BeginArea(new Rect(10,410,rightOfWayEditorWidth/2,dropDownMenuHeight), "", "DropDownMenuBlue");
		var curbsideSelectedTemp : int;
		GUILayout.Space(7);

		GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			curbsideSelectedTemp = GUILayout.SelectionGrid(curbsideSelected, curbsideButtons,4, GUILayout.Width(380), GUILayout.Height(76));
			curbsideMin = curbsideMinimums[curbsideSelectedTemp];
			curbsideMax = roadWidth;
			GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
		
		GUILayout.Space(60);
		
		GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			GUILayout.BeginVertical();
				GUILayout.Label(curbsideStrings[curbsideSelectedTemp], "text2", GUILayout.Height(25));
				if(CheckTicker()) {
					GUILayout.Label("Minimum Width: " + curbsideMin + " m", "redtext", GUILayout.Height(17));
				} else {
					GUILayout.Label("Minimum Width: " + curbsideMin + " m", "text", GUILayout.Height(17));
				}
				GUILayout.Label("Maximum Width: " + curbsideMax + " m", "text", GUILayout.Height(17));
			GUILayout.EndVertical();
			GUILayout.Space(10);
			GUILayout.BeginVertical();
				if (curbsideWidthTextbox == null) curbsideWidthTextbox = curbsideMin.ToString();
				tempTextbox = GUILayout.TextField(curbsideWidthTextbox, "textbox", GUILayout.Width(97), GUILayout.Height(39));

				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp) || curbsideSelectedTemp != curbsideSelected || defaultViewChanged) {
					if(CheckSliderPositionBesidesMedianZone()) {
						//Debug.Log("Error: Cannot add a curbside element beside a median");
						instructionMsg = "Error: Cannot add a curbside element beside a median";
						curbsideWidthTextbox = tempTextbox;
					} else if (ReturnLaneTypeColor(ReturnSelectedInfo(currPos,"Type")) == "Yellow Rect") {
						//Debug.Log("Error: Cannot add a curbside element on a median");
						instructionMsg = "Error: Cannot add a curbside element on a median";
						curbsideWidthTextbox = tempTextbox;
					} else if(roadSegmentInfo.kingStreet && ((ReturnSelectedInfo(currPos,"SegmentIndex") == 0 || ReturnSelectedInfo(currPos,"SegmentIndex") == currOffset.length-1)) && curbsideStrings[curbsideSelectedTemp] != "Sidewalk"){ // for the current project, there must be sidewalks for the king street
						instructionMsg = "Error: Currently, there must be sidewalks on King Street";
						curbsideWidthTextbox = tempTextbox;
					} else if(!OnlyOneSidewalkOnEachSide(ReturnSelectedInfo(currPos,"SegmentIndex"),ReturnSelectedInfo(currPos,"LeftOrRight")) && curbsideStrings[curbsideSelectedTemp] == "Sidewalk") {
						instructionMsg = "Error: Cannot have more than one sidewalk on each side";
						curbsideWidthTextbox = tempTextbox;
					} else {
						if (float.TryParse(tempTextbox, curbsideWidthTemp)){
							curbsideWidthTemp = Mathf.Round(curbsideWidthTemp*100)/100;
							if (curbsideWidthTemp < curbsideMin) {
								curbsideWidthTemp = curbsideMin;
							} else if (curbsideWidthTemp > curbsideMax ){
								curbsideWidthTemp = curbsideMax;
							}
							if(EditSegment(currPos, curbsideStrings[curbsideSelectedTemp], curbsideWidthTemp)) {
								//Debug.Log("RightOfWayUI log : Update Completed");
								changesMade = true;
								curbsideWidthTextbox = curbsideWidthTemp.ToString();
								curbsideWidthSlider = curbsideWidthTemp;
								UpdateLocalChange();
							} else {
								//Debug.Log("RightOfWayUI log : Cannot update!");
								curbsideWidthTextbox = ReturnSelectedInfo(currPos,"Width").ToString();
								curbsideWidthSlider = ReturnSelectedInfo(currPos,"Width");
							}
						} else {
							//Debug.Log("Error: Textbox input is not a numerical value");
							instructionMsg = "Error: Textbox input is not a numerical value";
						}
					}
				} else {
					curbsideWidthTextbox = tempTextbox;
				}
			GUILayout.EndVertical();
			GUILayout.Space(10);
		GUILayout.EndHorizontal();
		curbsideSelected = curbsideSelectedTemp;

	GUILayout.EndArea();
}	

private function TrafficZoneMenu(){
	GUILayout.BeginArea(new Rect(10,410,rightOfWayEditorWidth/2,dropDownMenuHeight), "", "DropDownMenuBlue");
		var trafficSelectedTemp : int;
		GUILayout.Space(7);

		GUILayout.BeginHorizontal();
			GUILayout.FlexibleSpace();
			trafficSelectedTemp = GUILayout.SelectionGrid(trafficSelected, trafficButtons,4, GUILayout.Width(380), GUILayout.Height(76));
			trafficMin = trafficMinimums[trafficSelectedTemp];
			trafficMax = roadWidth;
			GUILayout.FlexibleSpace();
		GUILayout.EndHorizontal();
		
		GUILayout.BeginHorizontal();

			GUILayout.FlexibleSpace();
			GUILayout.BeginVertical();
				GUILayout.Label(trafficStrings[trafficSelectedTemp], "text2", GUILayout.Height(25));
				if(CheckTicker()) {
					GUILayout.Label("Minimum Width: " + trafficMin + " m", "redtext", GUILayout.Height(17));
				} else {
					GUILayout.Label("Minimum Width: " + trafficMin + " m", "text", GUILayout.Height(17));
				}
				GUILayout.Label("Maximum Width: " + trafficMax + " m", "text", GUILayout.Height(17));
			GUILayout.EndVertical();
			GUILayout.Space(10);
			GUILayout.BeginVertical();
				GUILayout.Space(20);
				if (trafficWidthTextbox == null) trafficWidthTextbox = trafficMin.ToString();
				tempTextbox = GUILayout.TextField(trafficWidthTextbox, "textbox", GUILayout.Width(97), GUILayout.Height(39));
				if ((Event.current.keyCode == KeyCode.Return || Event.current.keyCode == KeyCode.KeypadEnter) && (Event.current.type == EventType.KeyUp) ||trafficSelectedTemp != trafficSelected || defaultViewChanged) {
					if (ReturnLaneTypeColor(ReturnSelectedInfo(currPos,"Type")) == "Yellow Rect") {
						//Debug.Log("Error: Cannot Change Median Zone to Traffic Zone");
						instructionMsg = "Error: Cannot Change Median Zone to Traffic Zone";
						trafficWidthTextbox = tempTextbox;
					} else if(roadSegmentInfo.kingStreet && (ReturnSelectedInfo(currPos,"SegmentIndex") == 0 || ReturnSelectedInfo(currPos,"SegmentIndex") == currOffset.length-1)){ // for the current project, there must be sidewalks for the king street
						instructionMsg = "Error: Currently, there must be sidewalks on King Street";
						curbsideWidthTextbox = tempTextbox;
					} else {
						if (float.TryParse(tempTextbox, trafficWidthTemp)){
							trafficWidthTemp = Mathf.Round(trafficWidthTemp*100)/100;
							if (trafficWidthTemp < trafficMin) {
								trafficWidthTemp = trafficMin;
							}
							else if (trafficWidthTemp > trafficMax ){
								trafficWidthTemp = trafficMax;
							}
							if(EditSegment(currPos, trafficStrings[trafficSelectedTemp], trafficWidthTemp)) {
								//Debug.Log("RightOfWayUI log : Update Completed");
								changesMade = true;
								trafficWidthTextbox = trafficWidthTemp.ToString();
								trafficWidthSlider = trafficWidthTemp;
								UpdateLocalChange();
							} else {
								//Debug.Log("RightOfWayUI log : Cannot Update!");
								trafficWidthTextbox = ReturnSelectedInfo(currPos,"Width").ToString();
								trafficWidthSlider = ReturnSelectedInfo(currPos,"Width");
							}
						} else {
							//Debug.Log("Error: Textbox input is not a numerical value");
							instructionMsg = "Error: Textbox input is not a numerical value";
						}
					}
				} else {
					trafficWidthTextbox = tempTextbox;
				}
			GUILayout.EndVertical();
			GUILayout.Space(10);
		GUILayout.EndHorizontal();
		trafficSelected = trafficSelectedTemp;

	GUILayout.EndArea();
}

// Closes the Right of Way UI correctly.
private function closeProcedure() {
	spaceConfigured = false;
	menuEnabled = false;
	uiAccessor.closeUI(UI.RightOfWay);

}
		
/*
	SetDefaultView is called to change the menu settings to the parameters: elementName and elementWidth
	isMedian is used because there are names that are identical in the Median Zone and the Traffic Zone
*/
private function SetDefaultView(elementName : String, elementWidth : float, isMedian : Boolean){

	if(!isMedian) {
		for (var i = 0 ; i < curbsideStrings.length ; i++){
			var Ename = curbsideStrings[i];
			if (Ename == elementName){
				activeView = ScreenView.CurbsideZone;
				curbsideWidthTextbox = (Mathf.Round(elementWidth*100)/100).ToString();
				curbsideWidthSlider = (Mathf.Round(elementWidth*100)/100);
				curbsideWidthTemp = (Mathf.Round(elementWidth*100)/100);
				curbsideSelected = i;
				return;
			}
		}
		for (i = 0 ; i < trafficStrings.length ; i++){
			Ename = trafficStrings[i];
			if (Ename == elementName){
				activeView = ScreenView.TrafficZone;
				trafficWidthTextbox = (Mathf.Round(elementWidth*100)/100).ToString();
				trafficWidthSlider = (Mathf.Round(elementWidth*100)/100);
				trafficWidthTemp = (Mathf.Round(elementWidth*100)/100);
				trafficSelected = i;
				return;
			}
		}
	} else {
		for (i = 0 ; i < medianStrings.length ; i++){
			Ename = medianStrings[i];
			if (Ename == elementName){
				activeView = ScreenView.MedianZone;
				medianWidthTextbox = (Mathf.Round(elementWidth*100)/100).ToString();
				medianWidthSlider = (Mathf.Round(elementWidth*100)/100);
				medianWidthTemp = (Mathf.Round(elementWidth*100)/100);
				medianSelected = i;
				return;
			}
		}
	}
}

private function DrawOnCrossSection(width : float){
	var sliderSize: float = 760;	
	var lenX: float = 60.0; //width of icon
	var lenY: float = 60.0; //height of icon
	var startX: float = 70 + 25;
	var startY: float = 200 - 70 - lenY;
	var factor: float = 15;
	var iconOffsetX: float = 95;

	var roadSegmentMain = gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain);
	var currElement : String;
	var currWidth: float;
	var tempCurrPos : float = currPos;
	var segmentNumber : int;

	GUILayout.BeginHorizontal();
		tempCurrPos = GUILayout.HorizontalSlider(currPos, 0.01, width-0.01, "sectionSlide", "sectionThumb", GUILayout.Width(sliderSize+10)); // +10 just to accommodate the extra width of the cross-section
	GUILayout.EndHorizontal();

	UpdateOffsets();

	if (!isOneWay){
		var lmr : String; // left median right to indicate the the side of the elements for the old function in RoadSegmentMain
		for (var i = 0; i < currOffset.length; i++) {
			if(i < numSegmentsLeft) {
				currElement = leftTypes[i];
				currWidth = leftWidths[i];
				lmr = "Left";
			} else if( i == numSegmentsLeft) {
				currElement = medianType;
				currWidth = medianWidth;
				lmr = "Median";
			} else {
				currElement = rightTypes[numSegmentsRight + numSegmentsLeft - i];
				currWidth = rightWidths[numSegmentsRight + numSegmentsLeft - i];
				lmr = "Right";
			}
			if (lmr != "Median") {
				if (currElement == "Sidewalk" || currElement == "Green Space"){
					GUI.DrawTexture(new Rect( (currOffset[i] +currWidth * 0.5) * (sliderSize) / width - lenX * 0.5 + iconOffsetX, startY-3, lenX, lenY), roadSegmentMain.ReturnTexture(currElement, lmr), ScaleMode.StretchToFill, true, 0);
					GUI.DrawTexture(new Rect( (currOffset[i]) * (sliderSize) / width + iconOffsetX, startY+57, currWidth * (sliderSize) / width, 3), roadSegmentMain.ReturnTexture("Black Rect", lmr), ScaleMode.StretchToFill, true, 0);
				}
				else {
					GUI.DrawTexture(new Rect( (currOffset[i] + currWidth * 0.5) * (sliderSize) / width - lenX * 0.5 + iconOffsetX, startY, lenX, lenY), roadSegmentMain.ReturnTexture(currElement, lmr), ScaleMode.StretchToFill, true, 0);
				}
				if(GUI.Button(new Rect(currOffset[i]*sliderSize/width + iconOffsetX, 132, currWidth*sliderSize/width, 30), "",ReturnLaneTypeColor(currElement))) {
					instructionMsg = "";
					if(ReturnLaneTypeColor(currElement) == "Red Rect") {
						trafficWidthTextbox = currWidth.ToString();
						trafficWidthSlider = currWidth;
					} else if(ReturnLaneTypeColor(currElement) == "Green Rect") {
						curbsideWidthTextbox = currWidth.ToString();
						curbsideWidthSlider = currWidth;
					}
					SetDefaultView(currElement,currWidth,false);
					tempCurrPos = currOffset[i] + currWidth/2;
				}
			} else {
				if (currElement != "Painted Line" && currElement != "Separated Median" && currElement != "Turning Lane") {
					GUI.DrawTexture(new Rect( (currOffset[i] + currWidth * 0.5) * (sliderSize) / width - lenX * 0.5 + iconOffsetX, startY, lenX, lenY), roadSegmentMain.ReturnTexture(currElement, lmr), ScaleMode.StretchToFill, true, 0);
				}
				if(GUI.Button(new Rect(currOffset[i]*sliderSize/width + iconOffsetX, 132, currWidth*sliderSize/width, 30), "",ReturnLaneTypeColor(currElement))) {
					instructionMsg = "";
					medianWidthTextbox = currWidth.ToString();
					medianWidthSlider = currWidth;
					SetDefaultView(currElement,currWidth,true);
					tempCurrPos = currOffset[i] + currWidth/2;
				}
			}
			if (i > 0) {
				GUI.DrawTexture( new Rect(currOffset[i]*sliderSize/width + iconOffsetX - 3, 132, 6, 30), roadSegmentMain.ReturnTexture("Black Rect", lmr), ScaleMode.StretchToFill, true, 0);
				if (Rect(currOffset[i]*sliderSize/width + iconOffsetX - 3, 132, 6, 30).Contains(Event.current.mousePosition)) {
					GUI.DrawTexture( new Rect(currOffset[i]*sliderSize/width + iconOffsetX - 8, 115, 16, 15), roadSegmentMain.ReturnAccessoriesTexture("boundaryIndicator"), ScaleMode.StretchToFill, true, 0);
					if (Input.GetMouseButtonDown(0) && !drag) {
						drag = true;
						selectedBoundary = i;
						//Debug.Log("RightOfWayUI log : Dragging Boundary = Mouse Down");
					}
				}
				if (Input.GetMouseButton(0) && drag) {
					var calculatedOffset : float = Mathf.Round(100*(parseFloat(Event.current.mousePosition.x)-iconOffsetX-3)*width/sliderSize)/100;
					var widthDiff : float;
					if(selectedBoundary < numSegmentsLeft) {
						//check leftWidths
						if(calculatedOffset < currOffset[selectedBoundary]) {
							//check selectedBoundary-1
							if(calculatedOffset - currOffset[selectedBoundary-1] >= ReturnMinWidth(leftTypes[selectedBoundary-1])) {
								widthDiff = currOffset[selectedBoundary] - calculatedOffset;
								leftWidths[selectedBoundary-1] -= widthDiff;
								leftWidths[selectedBoundary] += widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						} else {
							//check selectedBoundary+1
							if(currOffset[selectedBoundary+1] - calculatedOffset >= ReturnMinWidth(leftTypes[selectedBoundary])) {
								widthDiff = calculatedOffset - currOffset[selectedBoundary];
								leftWidths[selectedBoundary-1] += widthDiff;
								leftWidths[selectedBoundary] -= widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						}
					} else if (selectedBoundary == numSegmentsLeft) {
						//check leftWidths and MedianWidth
						if(calculatedOffset < currOffset[selectedBoundary]) {
							//check selectedBoundary-1
							if(calculatedOffset - currOffset[selectedBoundary-1] >= ReturnMinWidth(leftTypes[leftTypes.length-1])) {
								widthDiff = currOffset[selectedBoundary] - calculatedOffset;
								leftWidths[leftWidths.length-1] -= widthDiff;
								medianWidth += widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						} else {
							//check selectedBoundary+1
							if(currOffset[selectedBoundary+1] - calculatedOffset >= ReturnMinWidth(medianType)) {
								widthDiff = calculatedOffset - currOffset[selectedBoundary];
								leftWidths[leftWidths.length-1] += widthDiff;
								medianWidth -= widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the median has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the median has approached";
							}
						}
					} else if (selectedBoundary == numSegmentsLeft+1) {
						//check medianWidth and rightWidths
						if(calculatedOffset < currOffset[selectedBoundary]) {
							//check selectedBoundary-1
							if(calculatedOffset - currOffset[selectedBoundary-1] >= ReturnMinWidth(medianType)) {
								widthDiff = currOffset[selectedBoundary] - calculatedOffset;
								medianWidth -= widthDiff;
								rightWidths[rightWidths.length-1] += widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the median has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the median has approached";
							}
						} else {
							//check selectedBoundary+1
							if(currOffset[selectedBoundary+1] - calculatedOffset >= ReturnMinWidth(rightTypes[rightTypes.length-1])) {
								widthDiff = calculatedOffset - currOffset[selectedBoundary];
								medianWidth += widthDiff;
								rightWidths[rightWidths.length-1] -= widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						}
					} else {
						//check rightWidths
						var reverseIndex : int = numSegmentsLeft + numSegmentsRight + 1 - selectedBoundary;
						if(calculatedOffset < currOffset[selectedBoundary]) {
							//check selectedBoundary-1
							if(calculatedOffset - currOffset[selectedBoundary-1] >= ReturnMinWidth(rightTypes[reverseIndex])) {
								widthDiff = currOffset[selectedBoundary] - calculatedOffset;
								rightWidths[reverseIndex] -= widthDiff;
								rightWidths[reverseIndex-1] += widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						} else {
							//check selectedBoundary+1
							if(selectedBoundary == currOffset.length-1) {
								if(roadWidth - calculatedOffset >= ReturnMinWidth(rightTypes[0])) {
									widthDiff = calculatedOffset - currOffset[selectedBoundary];
									rightWidths[0] -= widthDiff;
									rightWidths[1] += widthDiff;
									instructionMsg = "";
								} else {
									//Debug.Log("Error: Minimum Width of the element has approached");
									TickerTimer(2);
									instructionMsg = "Error: Minimum Width of the element has approached";
								}
							} else {
								if(currOffset[selectedBoundary+1] - calculatedOffset >= ReturnMinWidth(rightTypes[reverseIndex-1])) {
									widthDiff = calculatedOffset - currOffset[selectedBoundary];
									rightWidths[reverseIndex-1] -= widthDiff;
									rightWidths[reverseIndex] += widthDiff;
									instructionMsg = "";
								} else {
									//Debug.Log("Error: Minimum Width of the element has approached");
									TickerTimer(2);
									instructionMsg = "Error: Minimum Width of the element has approached";
								}
							}
						}
					}
					UpdateOffsets();
				}
				if (Input.GetMouseButtonUp(0) && drag) {
					drag = false;
					selectedBoundary = 0; // none of the boundary is 0; it starts from 1
					UpdateLocalChange();
					//Debug.Log("RightOfWayUI log : Dragging Boundary = Mouse Up");
				}
			}
		}
		GUI.DrawTexture(new Rect(iconOffsetX+((currOffset[numSegmentsLeft] + currOffset[numSegmentsLeft+1])/2)*sliderSize/width - 1.5,30,3,100),roadSegmentMain.ReturnTexture("Black Rect", "Left"), ScaleMode.StretchToFill,true,0);
	}
	else if (isOneWay){
		//Debug.Log("RightOfWayUI log : Drawing Slider for One Way Street");
		for (i = 0 ; i < numSegmentsLeft ; i++){
			currElement = leftTypes[i];
			currWidth = leftWidths[i];		
			if (currElement == "Sidewalk" || currElement == "Green Space"){
				GUI.DrawTexture(new Rect( (currOffset[i] +currWidth * 0.5) * (sliderSize) / width - lenX * 0.5 + iconOffsetX, startY-3, lenX, lenY), roadSegmentMain.ReturnTexture(currElement, "Left"), ScaleMode.StretchToFill, true, 0);
				GUI.DrawTexture(new Rect( (currOffset[i]) * (sliderSize) / width + iconOffsetX, startY+57, currWidth * (sliderSize) / width, 3), roadSegmentMain.ReturnTexture("Black Rect", "Left"), ScaleMode.StretchToFill, true, 0);
			} else { 
				GUI.DrawTexture(new Rect( (currOffset[i] + currWidth * 0.5) * (sliderSize) / width - lenX * 0.5 + iconOffsetX, startY, lenX, lenY), roadSegmentMain.ReturnTexture(currElement, "Left"), ScaleMode.StretchToFill, true, 0);
			}
			if(GUI.Button(new Rect(currOffset[i]*sliderSize/width + iconOffsetX, 132, currWidth*sliderSize/width, 30), "",ReturnLaneTypeColor(currElement))) {
				instructionMsg = "";
				if(ReturnLaneTypeColor(currElement) == "Red Rect") {
					trafficWidthTextbox = currWidth.ToString();
					trafficWidthSlider = currWidth;
				} else if(ReturnLaneTypeColor(currElement) == "Green Rect") {
					curbsideWidthTextbox = currWidth.ToString();
					curbsideWidthSlider = currWidth;
				}
				SetDefaultView(currElement,currWidth,false);
				tempCurrPos = currOffset[i] + currWidth/2;
			}
			if (i > 0) {
				GUI.DrawTexture( new Rect(currOffset[i]*sliderSize/width + iconOffsetX - 3, 132, 6, 30), roadSegmentMain.ReturnTexture("Black Rect", "Left"), ScaleMode.StretchToFill, true, 0);
				if (Rect(currOffset[i]*sliderSize/width + iconOffsetX - 3, 132, 6, 30).Contains(Event.current.mousePosition)) {
					GUI.DrawTexture( new Rect(currOffset[i]*sliderSize/width + iconOffsetX - 8, 115, 16, 15), roadSegmentMain.ReturnAccessoriesTexture("boundaryIndicator"), ScaleMode.StretchToFill, true, 0);
					if (Input.GetMouseButtonDown(0) && !drag) {
						drag = true;
						selectedBoundary = i;
						//Debug.Log("RightOfWayUI log : Dragging Boundary = Mouse Down");
					}
				}
				if (Input.GetMouseButton(0) && drag) {
					calculatedOffset = Mathf.Round(100*(parseFloat(Event.current.mousePosition.x)-iconOffsetX-3)*width/sliderSize)/100;
					if(selectedBoundary < numSegmentsLeft) {
						//check leftWidths
						if(calculatedOffset < currOffset[selectedBoundary]) {
							//check selectedBoundary-1
							if(calculatedOffset - currOffset[selectedBoundary-1] >= ReturnMinWidth(leftTypes[selectedBoundary-1])) {
								widthDiff = currOffset[selectedBoundary] - calculatedOffset;
								leftWidths[selectedBoundary-1] -= widthDiff;
								leftWidths[selectedBoundary] += widthDiff;
								instructionMsg = "";
							} else {
								//Debug.Log("Error: Minimum Width of the element has approached");
								TickerTimer(2);
								instructionMsg = "Error: Minimum Width of the element has approached";
							}
						} else {
							//check selectedBoundary+1
							if(selectedBoundary == currOffset.length-1) {
								if(roadWidth - calculatedOffset >= ReturnMinWidth(leftTypes[leftTypes.length-1])) {
									widthDiff = calculatedOffset - currOffset[selectedBoundary];
									leftWidths[leftWidths.length-1] -= widthDiff;
									leftWidths[selectedBoundary-1] += widthDiff;
									instructionMsg = "";
								} else {
									//Debug.Log("Error: Minimum Width of the element has approached");
									TickerTimer(2);
									instructionMsg = "Error: Minimum Width of the element has approached";
								}
							} else {
								if(currOffset[selectedBoundary+1] - calculatedOffset >= ReturnMinWidth(leftTypes[selectedBoundary])) {
									widthDiff = calculatedOffset - currOffset[selectedBoundary];
									leftWidths[selectedBoundary-1] += widthDiff;
									leftWidths[selectedBoundary] -= widthDiff;
									instructionMsg = "";
								} else {
									//Debug.Log("Error: Minimum Width of the element has approached");
									TickerTimer(2);
									instructionMsg = "Error: Minimum Width of the element has approached";
								}
							}
						}
					}
					UpdateOffsets();
				}
				if (Input.GetMouseButtonUp(0) && drag) {
					drag = false;
					selectedBoundary = 0;
					UpdateLocalChange();
					//Debug.Log("RightOfWayUI log : Dragging Boundary = Mouse Up");
				}
			}
		}
	}
	currPos = OnWhichSegment(tempCurrPos, (tempCurrPos!=currPos));
}

/*
	OnWhichSegment is called to return the modified cursorPosition when the user drags the cross section cursor
	It creates the effect that the cursor stays in the same position when the user drags the cursor within the same segment
*/
private function OnWhichSegment(cursorPosition : float, setDefaultView : Boolean) {
	if(isOneWay) {
		for(var i = 0; i < currOffset.length; i++) {
			if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
				cursorPosition = currOffset[i] + leftWidths[i]/2;
				if(setDefaultView) {
					SetDefaultView(leftTypes[i],leftWidths[i],false);
				}
				return cursorPosition;
			}
		}
	} else {
		for(i = 0; i < currOffset.length; i++) {
			if(i<numSegmentsLeft) {
				//Check left widths
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
					cursorPosition = currOffset[i] + leftWidths[i]/2;
					if(setDefaultView) {
						SetDefaultView(leftTypes[i],leftWidths[i],false);
					}
					return cursorPosition;
				}
			} else if (i == numSegmentsLeft) {
				//Check median
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + medianWidth) {
					cursorPosition = currOffset[i] + medianWidth/2;
					if(setDefaultView) {
						SetDefaultView(medianType,medianWidth,true);
					}
					return cursorPosition;
				}
			} else {
				//Check right widths
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + rightWidths[numSegmentsLeft + numSegmentsRight - i]) {
					cursorPosition = currOffset[i] + rightWidths[numSegmentsLeft + numSegmentsRight - i]/2;
					if(setDefaultView) {
						SetDefaultView(rightTypes[numSegmentsLeft + numSegmentsRight - i],rightWidths[numSegmentsLeft + numSegmentsRight - i],false);
					}
					return cursorPosition;
				}
			}
		}
	}
}

/*
	UpdateOffsets updates the currOffset array using the leftWidths, medianWidth and rightWidths
	It is called when the values of leftWidths, medianWidth and rightWidths are changed (or to populate the currOffset array).
	This is necessary because currOffset is used when drawing the slider and updating the 3D world
*/
private function UpdateOffsets() {
	if(isOneWay) {
		currOffset = new float[numSegmentsLeft];
		currOffset[0] = 0;
		for(var i = 1; i < currOffset.length; i++) {
			currOffset[i] = Mathf.Round((currOffset[i-1] + leftWidths[i-1])*100)/100;
		}
	} else {
		currOffset = new float[numSegmentsLeft + numSegmentsRight + 1]; // 1 takes care of the median
		currOffset[0] = 0;
		for( i = 1; i < currOffset.length; i++) {
			if(i <= numSegmentsLeft) {
				currOffset[i] = Mathf.Round((currOffset[i-1] + leftWidths[i-1])*100)/100;
			} else if( i == numSegmentsLeft + 1) {
				currOffset[i] = Mathf.Round((currOffset[i-1] + medianWidth)*100)/100;
			} else {
				currOffset[i] = Mathf.Round((currOffset[i-1] + rightWidths[numSegmentsRight + numSegmentsLeft + 1 - i])*100)/100;
			}
		}
	}
}

private function EditSegment(cursorPosition : float, editType : String, editWidth : float) {
	var widthLeft : float;
	if(isOneWay) {
		for(var i = 0; i < currOffset.length; i++) {
			if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
				if(CheckEnoughSpace(editWidth-leftWidths[i] ,leftWidths ,leftTypes, i)){
					if (editWidth-leftWidths[i] > 0) {
						// Increasing target width
						widthLeft = editWidth-leftWidths[i];
						leftWidths[i] = editWidth;
						for(var j = i+1; j < leftWidths.length; j++) {
							if(leftWidths[j]-ReturnMinWidth(leftTypes[j]) > widthLeft) {
								leftWidths[j] -= widthLeft;
								widthLeft = 0;
								break;
							} else {
								widthLeft -= leftWidths[j] - ReturnMinWidth(leftTypes[j]);
								leftWidths[j] = ReturnMinWidth(leftTypes[j]);
							}
						}
					} else if (editWidth-leftWidths[i] < 0){
						//decreasing target width
						widthLeft = leftWidths[i] - editWidth;
						leftWidths[i] = editWidth;
						leftWidths[i+1] += widthLeft;
					}
					leftTypes[i] = editType;
					
					UpdateOffsets();
					return true;
				} else if (i == numSegmentsLeft-1) { // This is to add flexibility when changing the last elements in leftWidths[]
					if(editWidth < leftWidths[i]) {
						leftWidths[i-1] += leftWidths[i] - editWidth;
						leftWidths[i] = editWidth;
						leftTypes[i] = editType;
						UpdateOffsets();
						return true;
					} else if(editWidth > leftWidths[i]) {
						if(leftWidths[i-1] - ReturnMinWidth(leftTypes[i-1]) >= editWidth - leftWidths[i]) {
							leftWidths[i-1] -= editWidth - leftWidths[i];
							leftWidths[i] = editWidth;
							leftTypes[i] = editType;
							UpdateOffsets();
							return true;
						}
					}
				}
				return false;
			}
		}
	} else {
		for(i = 0; i < currOffset.length; i++) {
			if(i<numSegmentsLeft) {
				//Check left widths
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
					if(CheckEnoughSpace(editWidth-leftWidths[i] ,leftWidths ,leftTypes, i)){
						if (editWidth-leftWidths[i] > 0) {
							// Increasing target width
							widthLeft = editWidth-leftWidths[i];
							leftWidths[i] = editWidth;
							for(j = i+1; j < leftWidths.length; j++) {
								if(leftWidths[j]-ReturnMinWidth(leftTypes[j]) > widthLeft) {
									leftWidths[j] -= widthLeft;
									widthLeft = 0;
									break;
								} else {
									widthLeft -= leftWidths[j] - ReturnMinWidth(leftTypes[j]);
									leftWidths[j] = ReturnMinWidth(leftTypes[j]);
								}
							}
						} else if (editWidth-leftWidths[i] < 0){
							//decreasing target width
							widthLeft = leftWidths[i] - editWidth;
							leftWidths[i] = editWidth;
							leftWidths[i+1] += widthLeft;
						}
						leftTypes[i] = editType;
						
						UpdateOffsets();
						return true;
					} else if (i == numSegmentsLeft-1) { // This is to add flexibility when changing the last elements in leftWidths[]
						if(editWidth < leftWidths[i]) {
							leftWidths[i-1] += leftWidths[i] - editWidth;
							leftWidths[i] = editWidth;
							leftTypes[i] = editType;
							UpdateOffsets();
							return true;
						} else if(editWidth > leftWidths[i]) {
							if(leftWidths[i-1] - ReturnMinWidth(leftTypes[i-1]) >= editWidth - leftWidths[i]) {
								leftWidths[i-1] -= editWidth - leftWidths[i];
								leftWidths[i] = editWidth;
								leftTypes[i] = editType;
								UpdateOffsets();
								return true;
							}
						}
					}
					return false;
				}
			} else if (i == numSegmentsLeft) {
				//Check median
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + medianWidth) {
					
					if(editWidth - medianWidth < 0) {
						//Decreasing median width
						widthLeft = medianWidth - editWidth;
						leftWidths[leftWidths.length-1] += widthLeft/2;
						rightWidths[rightWidths.length-1] += widthLeft/2;
						medianWidth = editWidth;
						medianType = editType;
						UpdateOffsets();
						return true;
					} else if(editWidth - medianWidth > 0) {
						//Increasing median width
						if(leftWidths[leftWidths.length-1]+rightWidths[rightWidths.length-1]-ReturnMinWidth(leftTypes[leftTypes.length-1])-ReturnMinWidth(rightTypes[rightTypes.length-1]) > editWidth - medianWidth) {
							widthLeft = editWidth-medianWidth;
							leftWidths[leftWidths.length-1] -= widthLeft/2;
							rightWidths[rightWidths.length-1] -= widthLeft/2;
							medianWidth = editWidth;
							medianType = editType;
							UpdateOffsets();
							return true;
						} else {
							//Debug.Log("Error: Maximum width of the Median Zone has approached");
							instructionMsg = "Error: Maximum width of the Median Zone has approached";
							return false;
						}
					}
					medianType = editType;
					return true;
				}
			} else {
				//Check right widths
				var index : int = numSegmentsLeft + numSegmentsRight - i;
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + rightWidths[index]) {
					if(CheckEnoughSpace(editWidth-rightWidths[index],rightWidths,rightTypes,index)) {
						if (editWidth-rightWidths[index]>0) {
							// Increasing target width
							widthLeft = editWidth-rightWidths[index];
							rightWidths[index] = editWidth;
							for(j = index+1; j< rightWidths.length; j++) {
								if(rightWidths[j]-ReturnMinWidth(rightTypes[j]) > widthLeft) {
									rightWidths[j] -= widthLeft;
									widthLeft = 0;
									break;
								} else {
									widthLeft -= rightWidths[j] - ReturnMinWidth(rightTypes[j]);
									rightWidths[j] = ReturnMinWidth(rightTypes[j]);
								}
							}
						} else if (editWidth-rightWidths[index]<0) {
							// Decreasing target width
							widthLeft = rightWidths[index] - editWidth;
							rightWidths[index] = editWidth;
							rightWidths[index + 1] += widthLeft;
						}
						rightTypes[index] = editType;
						
						UpdateOffsets();
						return true;
					} else if (index == numSegmentsRight-1) { // This is to add flexibility when changing the last elements in rightWidths[]
						if(editWidth < rightWidths[index]) {
							rightWidths[index-1] += rightWidths[index] - editWidth;
							rightWidths[index] = editWidth;
							rightTypes[index] = editType;
							UpdateOffsets();
							return true;
						} else if(editWidth > rightWidths[index]) {
							if(rightWidths[index-1] - ReturnMinWidth(rightTypes[index-1]) >= editWidth - rightWidths[index]) {
								rightWidths[index-1] -= editWidth - rightWidths[index];
								rightWidths[index] = editWidth;
								rightTypes[index] = editType;
								UpdateOffsets();
								return true;
							}
						}
					}
					return false;
				}
			}
		}
	}
	//Debug.Log("Please Specify Which segment you want to apply changes on!");
	instructionMsg = "Error: Please Specify Which segment you want to apply changes on";
	return false;
}

private function CheckEnoughSpace(widthDiff : float, refWidths : float[], refTypes : String[], index : int) {
	var remainingWidth : float = widthDiff;
	if(widthDiff == 0) {
		// Width is not changed
		return true;
	} else if(widthDiff > 0) {
		// Increasing width
		for(var i = index+1; i < refWidths.length; i++) {
			widthDiff -= refWidths[i] - ReturnMinWidth(refTypes[i]);
			if(widthDiff <= 0) {
				return true;
			}
		}
		//Debug.Log("Error: Maximum Width of the Segment has approached");
		instructionMsg = "Error: Maximum Width of the Segment has approached";
		return false;
	} else {
		// Decreasing width
		if(index == refWidths.length - 1) {
			//Debug.Log("Error: The width of the inner most element cannot be decreased further");
			instructionMsg = "Error: The width of the inner most element cannot be decreased further";
			return false;
		}
		return true;
	}
}

/*
	ReturnLaneTypeColor takes the name of the road segment and returns its corresponding color code
	This is used in various occasions when trying to draw the sliders or 
*/
private function ReturnLaneTypeColor( name : String ) : String {
	if ( name == "Sidewalk" ) return "Green Rect";
	else if ( name == "BikeLane" ) return "Blue Rect";
	else if ( name == "Green Space" ) return "Green Rect";
	else if ( name == "Parking" ) return "Blue Rect";
	else if ( name == "Car" ) return "Red Rect";
	else if ( name == "Light Truck" ) return "Red Rect";
	else if ( name == "Heavy Truck" ) return "Red Rect";
	else if ( name == "Bus Rapid Transit" ) return "Red Rect";
	else if ( name == "Light Rail Transit" ) return "Red Rect";
	else if ( name == "Painted Line" ) return "Yellow Rect";
	else if ( name == "Turning Lane" ) return "Yellow Rect";
	else if ( name == "Separated Median" ) return "Yellow Rect";
	else if ( name == "Median Bus Rapid Transit" ) return "Yellow Rect";
	else if ( name == "Median Light Rail Transit" ) return "Yellow Rect";
	else return "Black Rect";
}

private function ReturnMinWidth( name : String ) : float {
	if ( name == "Sidewalk" ) return 1.2;
	else if ( name == "BikeLane" ) return 1.5;
	else if ( name == "Green Space" ) return 0.6;
	else if ( name == "Parking" ) return 2.4;
	else if ( name == "Car" ) return 3.05;
	else if ( name == "Light Truck" ) return 3.35;
	else if ( name == "Heavy Truck" ) return 3.66;
	else if ( name == "Bus Rapid Transit" ) return 3.35;
	else if ( name == "Light Rail Transit" ) return 3.35;
	else if ( name == "Painted Line" ) return 0.1;
	else if ( name == "Turning Lane" ) return 4;
	else if ( name == "Separated Median" ) return 1.2;
	else if ( name == "Median Bus Rapid Transit" ) return 7;
	else if ( name == "Median Light Rail Transit" ) return 7;
	else {
		Debug.Log("RightOfWayUI log : Minimum Width not defined for " + name);
		return 3;
	}
}

/*
	ReturnSelectedInfo finds the cursorPosition in the slider and returns a specific piece of info on the segment selected.
	For now, the specific piece of info can either be Width, Type or Offset.
*/
private function ReturnSelectedInfo( cursorPosition : float, type : String ) {
	if(cursorPosition == 0) {
		cursorPosition = (currOffset[0] + currOffset[1])/2;
	}
	if(isOneWay) {
		for(var i = 0; i < currOffset.length; i++) {
			if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
				if(type == "Width") {
					return Mathf.Round(leftWidths[i]*100)/100;
				} else if (type == "Type") {
					return leftTypes[i];
				} else if (type == "Offset") {
					return currOffset[i];
				} else if (type == "SegmentIndex") {
					return i;
				} else if (type == "LeftOrRight") {
					if(i <= (leftTypes.length-1)/2) return "Left";
					else return "Right";
				}
			}
		}
	} else {
		for(i = 0; i < currOffset.length; i++) {
			if(i<numSegmentsLeft) {
				//Check left widths
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + leftWidths[i]) {
					if(type == "Width") {
						return Mathf.Round(leftWidths[i]*100)/100;
					} else if (type == "Type") {
						return leftTypes[i];
					} else if (type == "Offset") {
						return currOffset[i];
					} else if (type == "SegmentIndex") {
						return i;
					} else if (type == "LeftOrRight") {
						return "Left";
					}
				}
			} else if (i == numSegmentsLeft) {
				//Check median
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + medianWidth) {
					if(type == "Width") {
						return Mathf.Round(medianWidth*100)/100;
					} else if (type == "Type") {
						return medianType;
					} else if (type == "Offset") {
						return currOffset[i];
					} else if (type == "SegmentIndex") {
						return i;
					} else if (type == "LeftOrRight") {
						return "Median";
					}
				}
			} else {
				//Check right widths
				if(cursorPosition > currOffset[i] && cursorPosition < currOffset[i] + rightWidths[numSegmentsLeft + numSegmentsRight - i]) {
					if(type == "Width") {
						return Mathf.Round(rightWidths[numSegmentsLeft + numSegmentsRight - i]*100)/100;
					} else if (type == "Type") {
						return rightTypes[numSegmentsLeft + numSegmentsRight - i];
					} else if (type == "Offset") {
						return currOffset[i];
					} else if (type == "SegmentIndex") {
						return i;
					} else if (type == "LeftOrRight") {
						return "Right";
					}
				}
			}
		}
	}
	return null;
}

/*
	CheckSliderPositionBesidesMedianZone checks to see if the cursorPosition (currPos in this case) is
	besides the Median Zone. For example, it is used to throw an error when the user tries to change
	the lane besides the median zone to a curbside element
*/
private function CheckSliderPositionBesidesMedianZone() {
	if(isOneWay) {
		return false;
	} else {
		if(ReturnSelectedInfo(currPos,"Offset") == currOffset[numSegmentsLeft-1] || ReturnSelectedInfo(currPos,"Offset") == currOffset[numSegmentsLeft+1]) {
			//Debug.Log("RightOfWayUI log : Slider Position is besides the Median Zone");
			return true;
		}
		return false;
	}
}

/*
	True if there is only one sidewalk on each side
*/
private function OnlyOneSidewalkOnEachSide(addingSidewalkAt : int, LeftOrRight : String) {
	var sidewalkNumber : int = 0;
	if(isOneWay) {
		for(var i = 0; i < leftTypes.length; i++) {
			if(leftTypes[i] == "Sidewalk") sidewalkNumber++;
			if(i == addingSidewalkAt && leftTypes[i] != "Sidewalk") sidewalkNumber++;
			if((i < (leftTypes.length-1)/2) && sidewalkNumber > 1) return false;
			if((i > (leftTypes.length-1)/2) && sidewalkNumber > 2) return false;
		}
		return true;
	} else {
		for(i = 0; i < leftTypes.length; i++) {
			if(leftTypes[i] == "Sidewalk") sidewalkNumber++;
			if(LeftOrRight == "Left" && i == addingSidewalkAt && leftTypes[i] != "Sidewalk") sidewalkNumber++;
		}
		if(sidewalkNumber > 1) return false;
		for(i = 0; i < rightTypes.length; i++) {
			if(rightTypes[i] == "Sidewalk") sidewalkNumber++;
			if(LeftOrRight == "Right" && i == numSegmentsLeft + numSegmentsRight - addingSidewalkAt && rightTypes[i] != "Sidewalk") sidewalkNumber++;
		}
		if(sidewalkNumber > 2) return false;
		return true;
	}
}

/*
	InstructionMessageType returns the type of the message based on the message string
	The return value is normally used as the skin name.
*/
private function InstructionMessageType( message : String ) {
	if (message == "") return "InstructionBox";
	if(message.Substring(0,5) == "Error") {
		return "ErrorBox";
	} else {
		return "InstructionBox";
	}
}

/*
	InstructionMessage simply returns the trimmed message
	based on the message type.
*/
private function InstructionMessage( message : String ) {
	if(InstructionMessageType(message) == "ErrorBox") {
		return message.Substring(6);
	} else {
		return message;
	}
}


/*
	UpdateLocalChange updates all the local variables in the RightOfWay Editor to the InstantiateRoadElements scripts and the 3D world.
	In addition, it updates all the roadSegments in the same block. Within the UpdateRoadElements function, the localized change list
	is also updated, so we reset the unredoList and the listPointer.
*/
function UpdateLocalChange() {
	gameObject.Find("/AvatarHandler").GetComponent(AvatarManager).DestroySidewalkPedestrian(unityName);
	gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).UpdateRoadElements(roadSegmentObject, isOneWay, roadWidth, numSegmentsLeft, leftTypes, leftWidths, numSegmentsRight, rightTypes, rightWidths, medianType, medianWidth, true, false);
	if(multipleSegments) {
		for(var i = 0; i < unityNamesArray.length; i++) {
			var roadSegmentObjectInSameBlock : GameObject = GameObject.Find("Road Segments/"+unityNamesArray[i]);
			var roadWidthInSameBlock : float = parseFloat(unityNamesArray[i].Split("_"[0])[5]);
			gameObject.Find("/AvatarHandler").GetComponent(AvatarManager).DestroySidewalkPedestrian(unityNamesArray[i]);
			gameObject.Find("RoadHandler").GetComponent(RoadSegmentMain).UpdateRoadElements(roadSegmentObjectInSameBlock, isOneWay, roadWidthInSameBlock, numSegmentsLeft, leftTypes, leftWidths, numSegmentsRight, rightTypes, rightWidths, medianType, medianWidth, true, false);
		}
	}
	instructionMsg = "";
	unredoList = gameObject.Find("DataHandler").GetComponent(UserDataBackend).ReturnListOfPreviousRoadsChanges(unityName,numRowsOfUnredoList);
	if (unredoList != null) {
		listPointer = unredoList.length - 2;
	}
	changesMade = true;
	RedrawIntersectionSidewalk(intersectionNamesArray);
}

function RedrawIntersectionSidewalk (intersectionsArray : String[]) {
	if(intersectionsArray.length > 0) {
		for(var i = 0; i < intersectionsArray.length; i++) {
			//Debug.Log("RightOfWayUI log : intersectionsArray[" + i +"] : " + intersectionsArray[i]);
			if(GameObject.Find("Road Segments/"+intersectionsArray[i]) != null) {
				// For the time being, only intersection in King street with 4 Junctions can be modified
				if(GameObject.Find("Road Segments/"+intersectionsArray[i]).GetComponent(InstantiateIntersections).kingStreet && GameObject.Find("Road Segments/"+intersectionsArray[i]).GetComponent(InstantiateIntersections).numOfJunctions == 4) {
					if(GameObject.Find("Road Segments/"+intersectionsArray[i]).GetComponent(InstantiateIntersections).ModifyIntersection()) {
						//Debug.Log("RightOfWayUI log : Done modifying sidewalk");
					}
				} else {
					//Debug.Log("RightOfWayUI log : For the current version of IRUS, only intersections on King Street with 4 Junctions will be modified.");
				}
			} else {
				Debug.Log("RightOfWayUI log : The intersection name in the database does not correspond to the GameObject name in Unity.");
				Debug.Log("RightOfWayUI log : The database name is = " + intersectionsArray[i]);
			}
		}
	}
}

private function TickerTimer(duration : float) {
	if(!tickerTimerInUse) {
		tickerTimerInUse = true;
		if(duration < 0 || Mathf.Approximately(duration,0.0)) ticker = false;
		ticker = true;
		yield WaitForSeconds(duration);
		ticker = false;
		tickerTimerInUse = false;
	}
}

function CheckTicker() {
	return ticker;
}

function ResetTickerTimer() {
	tickerTimerInUse = false;
	ticker = false;
}

		
		
		
		
		
		
		
		
		