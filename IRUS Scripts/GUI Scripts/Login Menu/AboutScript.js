var customSkin : GUISkin;
public var dottedLine : Texture2D;
private var title_pivot : Vector2;


function OnGUI () {
	GUI.skin = customSkin;
	
	var buttonW : int = 150;
	var buttonH : int = 50;
	var halfScreenW : float = Screen.width * 0.5;
	var halfScreenH : float = Screen.height *0.5;
	
	//Vector2(150,50) : Vector2;
	
	GUI.BeginGroup (new Rect((halfScreenW - 256.5), (halfScreenH - 256.5), 513, 513), "", "PinkFolder");
			
			GUILayout.BeginArea(Rect(50,50,400,400));
				GUILayout.Label("ABOUT IRUS:");
				GUI.DrawTexture(Rect(15,35,370,6),dottedLine,ScaleMode.StretchToFill,true,10.0f);
				
				GUILayout.Space(25);
				
				GUILayout.BeginHorizontal();
				GUILayout.Space(15);
				GUILayout.Label("IRUS is meant to act as a planning tool, which will foster public involvement in urban design and improve development decisions.\n\nThe program was developed by the EDIT (Environmental Design through Interactive Technologies) Lab within the University of Waterloo's School of Planning.", "Text2"); 
				GUILayout.Space(15);
				GUILayout.EndHorizontal();
			
			GUILayout.EndArea();
			
			//Folder button
			if (GUI.Button(Rect(475, 400, 30, 30), "", "pink")) {
					Debug.Log("Flip to About Folder");
			}
			
			//Folder title
			GUI.BeginGroup(new Rect(490,150,150,150));
				GUIUtility.RotateAroundPivot(90, title_pivot);
				GUILayout.Label("ABOUT", "Text");
				GUIUtility.RotateAroundPivot(-90, title_pivot);
			GUI.EndGroup();
						
	GUI.EndGroup();
}