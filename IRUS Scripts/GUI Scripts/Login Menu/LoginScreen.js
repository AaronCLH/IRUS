var customSkin : GUISkin;
var passwordToEdit : String = "My Password";
var stringToEdit : String = "enter username";
public var dottedLine : Texture2D;
var startButton : Texture;


function OnGUI () {
	GUI.skin = customSkin;
	
	var buttonW : int = 150;
	var buttonH : int = 50;
	var halfScreenW : float = Screen.width * 0.5;
	var halfScreenH : float = Screen.height *0.5;
	
	
	//GUI.BeginGroup(new Rect(Screen.width, Screen.height, 1024, 512), "" , "map");
		
	
		GUI.BeginGroup (new Rect((halfScreenW - 256.5), (halfScreenH - 256.5), 513, 513), "", "GrayFolder");
			
				//Folder Title "Login"
				GUI.color = Color.white;
				GUI.Label(Rect(75,20,200,40), "IRUS LOGIN");
				
				//Folder button
				if (GUI.Button(Rect(400, 10, 30, 30), "", "gray")) {
					Debug.Log("Flip to Login Folder");
				}
			
			GUILayout.Space(80);
			
			GUILayout.BeginVertical();//(halfScreenW - 256.5), (halfScreenH - 256.5), 513, 513);
				//Enter Username
				GUILayout.BeginHorizontal();
					GUILayout.Space(65);
					GUI.color = Color.white;
					GUILayout.Label("Username");
					stringToEdit = GUILayout.TextField(stringToEdit,50);
					GUILayout.Space(50);
				GUILayout.EndHorizontal();
				
				GUILayout.Space(15);
				
				//Enter Password
				GUILayout.BeginHorizontal();
					GUILayout.Space(65);
					GUI.color = Color.white;
					GUILayout.Label("Password");
					
					passwordToEdit = GUILayout.PasswordField(passwordToEdit, "*"[0], 25);
					GUILayout.Space(50);
				GUILayout.EndHorizontal();
				
				GUI.DrawTexture(Rect(96.5,210,300,6),dottedLine,ScaleMode.StretchToFill,true,10.0f);
				
				
				GUILayout.BeginHorizontal();
					if(GUI.Button(Rect(156.5, 235, 200, 200),"", "StartButton")) {
						Debug.Log("Load King Street");
					}
				GUILayout.EndHorizontal();
				
								
			GUILayout.EndVertical();
		
		
		/*
			if (GUI.Button(Rect(halfScreenW - (buttonW * 0.5), 560, buttonW, buttonH), "START")) {
				//Application.LoadLevel("King Street_Current");
				Debug.Log("Flip to Login Folder");
			}
			
			if (GUI.Button(Rect(halfScreenW - (buttonW * 0.5), 620, buttonW, buttonH), "CREATE ACCOUNT")) {
				Debug.Log("Flip to Create Account Folder");
			}
			
			if (GUI.Button(Rect(halfScreenW - (buttonW * 0.5), 680, buttonW, buttonH), "TUTORIALS")) {
				Debug.Log("Flip to Tutorials Folder");
			}
		
			if (GUI.Button(Rect(halfScreenW - (buttonW * 0.5), 740, buttonW, buttonH), "ABOUT")) {
				Debug.Log("Flip to About Folder");
			}
		*/		
		
		GUI.EndGroup();
	//GUI.EndGroup();
}