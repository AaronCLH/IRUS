#pragma strict

static var parcel : Parcel;

private var previewHandler : PreviewManager;
private var buildingType : Type;
private var pbm : ParcelBuildingManager;
private var emptyLib : boolean;

// OnGUI variables
private var scrollPositionSpecies : Vector2;	// scrolling for Species selectiongrid
private var selectedSpeciesInd : int = 0;		// index of selected Species in the speciesList
public var guiBackground : GUITexture;
private var removeMargin : GUIStyle;
public var skin : GUISkin;
public var dottedLine : Texture2D;

function Awake () {	
	previewHandler = GameObject.Find(PreviewManager.SCRIPT_HOST).GetComponent(PreviewManager);
	pbm = GameObject.Find(ParcelBuildingManager.SCRIPT_HOST).GetComponent(ParcelBuildingManager);
	buildingType = pbm.getBuildingType();
	guiBackground = Instantiate(guiBackground);
	guiBackground.guiTexture.enabled = false;
}

function OnEnable () {
	emptyLib = (pbm.getBuildingType().getNumSpecies() == 0);
	previewHandler.enablePreview();
}

function OnGUI() {
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	
	guiBackground.guiTexture.pixelInset.width = 360;//Screen.width*0.4;
	guiBackground.guiTexture.pixelInset.height = 560;//Screen.height*.87;
	if (!guiBackground.guiTexture.enabled) {
		guiBackground.guiTexture.pixelInset.x = -(Screen.width*0.5)+10;//-950;
		guiBackground.guiTexture.pixelInset.y = (Screen.height*0.5)-570;//-400;
		guiBackground.guiTexture.enabled = true;
	}
	
	GUI.DrawTexture(Rect(20,80, 300, 6),dottedLine,ScaleMode.StretchToFill,true,10.0f);
	GUI.DrawTexture(Rect(20,307, 300, 6),dottedLine,ScaleMode.StretchToFill,true,10.0f);
	
	GUILayout.BeginArea(Rect(10, 10, 325, 550)); //Screen.height*0.125, Screen.width*0.29, Screen.height*0.75));
		GUILayout.Space(10);
		GUILayout.Label("CHOOSE REPLACEMENT MODEL", "title");
		GUILayout.BeginVertical();
			
			//removeMargin = new GUIStyle(GUI.skin.box);
			//removeMargin.margin.bottom = 0;
			GUILayout.Box("Building Preview", "text");
			GUILayout.Space(20);
			removeMargin = new GUIStyle(GUI.skin.box);
			removeMargin.margin.top = 0;
			GUILayout.BeginHorizontal();
			GUILayout.Space(10);
			GUILayout.Label("", removeMargin, GUILayout.Height(200), GUILayout.Width(295));//Screen.height*0.2));
			if (!emptyLib && Event.current.type == EventType.Repaint) {
				var r : Rect = GUILayoutUtility.GetLastRect();
				//r.y += //Screen.height*0.125;
				previewHandler.showPreviewObject(r, buildingType.getSpecies(selectedSpeciesInd).getPrefab());
			}
			GUILayout.EndHorizontal();
			
			GUILayout.Space(25);		
			
			if (!emptyLib) {
				scrollPositionSpecies = GUILayout.BeginScrollView(scrollPositionSpecies, GUILayout.Width(295), GUILayout.MaxHeight(185));//Screen.width*0.27));
					selectedSpeciesInd = GUILayout.SelectionGrid(selectedSpeciesInd, buildingType.getSpeciesNames(), 1, "background"); //, GUILayout.MaxWidth(270), GUILayout.Height(193));
				GUILayout.EndScrollView();
			} else {
				
				GUILayout.Box("-EMPTY-", "empty1", GUILayout.Height(92.5));
				GUILayout.Box("No models uploaded", "empty2", GUILayout.Height(92.5));
				//GUILayout.Space(113);
			}
			
		GUILayout.EndVertical();	
		GUILayout.Space(10);
		
		GUILayout.BeginHorizontal();
			GUILayout.Space(15); 
			if (emptyLib) GUI.enabled = false;
				if (GUILayout.Button("", "placeBuilding", GUILayout.Height(37), GUILayout.Width(186))) {
					placeBuilding();
				}
			GUI.enabled = true;
		
		
			GUILayout.FlexibleSpace();
			if (GUILayout.Button("", "done", GUILayout.Width(62), GUILayout.Height(37))) {
				closeProcedure();
			}
			GUILayout.Space(18);			
		GUILayout.EndHorizontal();
		//GUILayout.Space(15);
	GUILayout.EndArea();
}

private function placeBuilding () {
	parcel.placeBuilding(buildingType.getSpecies(selectedSpeciesInd).getPrefab());
	yield;	// the Building script on the new buiding is not initialized yet until the next frame
			// which may cause problem when opening a new Land Use UI on that building/parcel
			// because it calls ghost() on that script, which requires initializations to be done before
	closeProcedure();
}

private function closeProcedure () {
	guiBackground.guiTexture.enabled = false;
	previewHandler.disablePreview();
	var uiAccessor : UIControl = gameObject.GetComponent(UIControl);
	uiAccessor.closeUI(UI.BuildingReplace);
	uiAccessor.openUI(UI.LandUse);
	uiAccessor.gameObject.GetComponent(LandUseUI).newContext(parcel);
	uiAccessor.gameObject.GetComponent(LandUseUI).pushLayerToTop(LandUseLayer.BuildingEditor);
}