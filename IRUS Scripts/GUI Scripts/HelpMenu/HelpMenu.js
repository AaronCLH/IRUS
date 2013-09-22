public var skin : GUISkin;
private var scrollPosition : Vector2;  //help menu
private var scrollPosition1 : Vector2; // Navigation
private var scrollPosition2 : Vector2; // Land Use
private var scrollPosition3 : Vector2; // Urban Design
private var scrollPosition4 : Vector2; // Upload Obj
private var scrollPosition5 : Vector2; // Main Menu
private var scrollPosition6 : Vector2; // Edit Objects
private var scrollPosition7 : Vector2; // ScreenShot
private var scrollPosition8 : Vector2; // Edit ROW
private var windowRect : Rect = Rect (15, 15, 430, 482);
///////// The text for all Help Menu components /////////////////////////////////////////////////////////////////////////////
//
//
//

private var navigation = "To navigate through the IRUS environment, use the 'W, S, A, D' keys, or use the arrow keys. To direct the camera view, move your mouse pointer across the screen. If you wish to edit a streetscape, click the right mouse button to lock the camera view. Now with the camera locked, you can click on the buildings and objects within your view. As well, the movement keys and arrow buttons still function and allow you to navigate the scene.";

private var pieMenu = "The Pie Menu tool allows you to access all the features within IRUS. Clicking on the Pie menu will open the IRUS icon and the buttons for the various sub-menus. To close the main Pie Menu, click on the IRUS icon again. The Pie menu includes the Land Use and Street Furniture sub-menus, the File Browser and Screen Shot tools.";

private var landUse = "The Land Use menu allows you to edit property information, the zoning class for a parcel, and the building on a parcel. In the Information Editor you can view, and in some cases edit, a property?s address, its assessment roll number, the property value, its current owner/manager, date of construction, as well as add any custom fields to the property information. The Building Editor allows the user to manipulate the building on a property. Currently, most buildings in IRUS consist of simple massing models. You are able to move, rotate, destroy and replace buildings with your own .OBJ creations. Another purpose of the building editor is to showcase design proposals, and allow the community to see a visualization of the designs before the project is created. The building editor also provides a 'street view' image of that property imported from Google Maps. The Parcel Editor allows for changes to be made to a property?s zoning information and setback lines. You can look into the existing requirements of the property including its current zoning, minimum setback, and any encumbrances, or flip to a scenario where you can adjust the zoning, setback distances, minimum and maximum building heights, and also visualize the massing on that property using the massing height tool.";

private var urbanDesign = "The Urban Design menu consists of features that allow you to place and manipulate objects on the streetscape. The Street Furniture folder provides an object library through which users can place objects such as benches, street lamps, bollards, or trash cans onto the sidewalks. The vegetation folder provides a library of trees and planters. Objects can be placed on a block-by-block basis, or be placed individually. The user can determine exactly how many objects they would like to place on the street. There are also tools to rotate, move, and delete individual or multiple objects. In addition, users can import custom designed objects, store and retrieve them within the Urban Design object library.";

private var uploadObj = "The File Browser menu allows you to upload and share your own objects. Currently IRUS can only upload objects in the .OBJ file format. The types of objects that you may import include buildings, street furniture, or vegetation.  By clicking the file browser tool, your computer will pop-up a default file browser, where you can choose an .OBJ file from your own computer's directory. After you have chosen your file, IRUS will load the object. Once loading has completed you will be asked to categorize the object as a building, street furniture, or vegetation object. When creating objects to import into IRUS, be sure that all components of that object are 'ungrouped'. For instance, if using a modeling program such as Google SketchUp, make sure all components of the model have been un-grouped or 'exploded'. This ensures that the object will function properly in IRUS.";

private var editObj = "In IRUS you may find yourself wanting to manipulate specific objects or groups of objects on the street. To manipulate an object, it is as simple as clicking an object in your view. Doing so will bring up a menu with all the possible manipulation options for that object. In most cases, you are allowed to rotate, move, scale, or delete selected objects. To select multiple objects, you may click on them sequentially (notice the change in total number of objects selected in the menu), to deselect an object, just click on it again. Alternatively, you may use the 'select all' button which selects all the objects of a type on that street. This could be useful when rotating a group of benches or streetlights while keeping them in a uniform position.";

private var screenshot = "While working in IRUS, users are allowed to capture images of the scenes they have created. The Screen Shot tool will capture an image of the streetscape. To use this tool, make sure that you aim your viewpoint to capture the features that you would like to appear in your image. To lock the view, just click the right button on your mouse. To get out of the locked view mode, click the right mouse button again. Once your screen is locked in a desired position, open the Screen Shot tool from the Pie Menu. In the pop-up dialog box that appears, choose a save location for the .PNG image you are about to create. Once you decide on the location where your file will be created and click 'choose', the image will automatically be saved to that location. Any menus that you had open during the time of the screen shot will not appear in this image; the image will only be of the streetscape.";

private var editROW = "This feature is not yet available. Users will be able to adjust lane widths, sidewalk widths, add bike lanes, reduce or add vehicle lanes, adjust ROW textures and materials.";
//
//
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function OnGUI(){
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	windowRect = GUILayout.Window (0, windowRect, MakeMyWindow, "", "HelpFolder");
	
}

function MakeMyWindow(){
	var tempSkin : GUISkin = GUI.skin;
	GUI.skin = skin;
	
	//GUI.BeginGroup(new Rect(Screen.width-445, 15, 430, 482), "", "HelpFolder");
	//GUILayout.BeginArea(Rect(50, 10, 370, 462));
		GUILayout.BeginHorizontal();
	
			//GUILayout.BeginVertical();
			//GUILayout.Space(70);
			//GUILayout.EndVertical();
			//GUILayout.Space(10);
			GUILayout.FlexibleSpace();
			GUILayout.BeginVertical();
			GUILayout.Space(10);
		GUILayout.Label("HELP MENU", "Title", GUILayout.Height(35));
			scrollPosition = GUILayout.BeginScrollView (scrollPosition, GUILayout.Width (370), GUILayout.Height (375));
    			GUILayout.Space(10);
    			GUILayout.Label("NAVIGATION", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition1 = GUILayout.BeginScrollView(scrollPosition1, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (navigation, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("MAIN MENU", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition5 = GUILayout.BeginScrollView(scrollPosition5, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (pieMenu, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("LAND USE", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition2 = GUILayout.BeginScrollView(scrollPosition2, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (landUse, "subScroll");
    					GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("URBAN DESIGN", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition3 = GUILayout.BeginScrollView(scrollPosition3, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (urbanDesign, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("UPLOAD .OBJ FILES", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition4 = GUILayout.BeginScrollView(scrollPosition4, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (uploadObj, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("EDIT OBJECTS", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition6 = GUILayout.BeginScrollView(scrollPosition6, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (editObj, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();  		
    			
    			GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("EDIT RIGHT-OF-WAY", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition8 = GUILayout.BeginScrollView(scrollPosition8, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (editROW, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			GUILayout.Space(10);
    			
    				GUILayout.Space(15);
    			GUILayout.Box("","dottedLine", GUILayout.Width(350), GUILayout.Height(8));
    			GUILayout.Space(15);
    			
    			GUILayout.Label("SCREENSHOT CAPTURE", "subTitle");
    			GUILayout.BeginHorizontal();
    				GUILayout.Box("video here", GUILayout.Width(171.5), GUILayout.Height(150));
    				scrollPosition7 = GUILayout.BeginScrollView(scrollPosition7, "subScroll", GUILayout.Height(150));
    					GUILayout.Label (screenshot, "subScroll");
    				GUILayout.EndScrollView();
    			GUILayout.EndHorizontal();
    			GUILayout.Space(10); 		
    		GUILayout.EndScrollView ();    	 		
    	 	
    	 	GUILayout.FlexibleSpace();
    	 	if (GUILayout.Button("", "Close", GUILayout.Width(93), GUILayout.Height(32))){
    	 		GameObject.Find(UIControl.SCRIPT_HOST).GetComponent(HelpMenu).enabled = false;
    	 	}    
    	 	
    	 	GUILayout.Space(10);
    	 	GUILayout.EndVertical();
    	 	GUILayout.Space(10);
    	 	GUILayout.EndHorizontal();	 	
    	 	//GUILayout.EndArea();    	 	
   	//GUI.EndGroup();
   	
   	  GUI.DragWindow ();
}
	







