// This C# script initializes the FileBrowser which is used to import a new Obj that is an .obj file.  



using UnityEngine;
//using UnityEditor;
using System.Collections;
//using System.IO;

public class FileBrowserUI : MonoBehaviour {
	
	private const string WHERE_IS_ImportObject = "Browser";
	
	public GUISkin skin;

    public string[] fileExtensions = {"obj"};
    
    protected string m_textPath;
    
    //protected FileBrowser m_fileBrowser;
    
    protected bool importerOn = false;
    
    [SerializeField]
    protected Texture2D m_directoryImage,
                        m_fileImage;
        
    protected void OnEnable(){   
        UniFileBrowser.use.filterFiles = true;
        UniFileBrowser.use.filterFileExtensions = fileExtensions;
        UniFileBrowser.use.SetWindowTitle("Select an Obj File to Import");
        UniFileBrowser.use.SendWindowCloseMessage(FileWindowClose);
        UniFileBrowser.use.OpenFileWindow(OpenFile);
    }

    void OpenFile (string pathToFile) {
        if(pathToFile.Length <= 0) {
            Debug.Log("FileBrowserUI log : No file is selected");
        }
        Debug.Log("FileBrowserUI log : " + pathToFile + " is selected");
        GameObject.Find(WHERE_IS_ImportObject).SendMessage("nonweb_newObj", "file://" + pathToFile);
    }

    void OpenFiles (string[] pathsToFiles) {
        if(pathsToFiles.Length <= 0) {
            Debug.Log("FileBrowserUI log : No files is selected");
        }
        for (var i = 0; i < pathsToFiles.Length; i++) {
            Debug.Log("FileBrowserUI log : " + pathsToFiles[i] + " is selected");
            GameObject.Find(WHERE_IS_ImportObject).SendMessage("nonweb_newObj", "file://" + pathsToFiles[i]);
        }
    }

    void FileWindowClose () {
        GameObject.Find("UI Handler").SendMessage("closeUI", 2);
    }
           
    
	/*
	void OnEnable () {
		
        m_fileBrowser = new FileBrowser(
            new Rect(Screen.width/3, Screen.height/3, Screen.width/3, Screen.height/3),
            "Choose Obj File",
            FileSelectedCallback
        );
        m_fileBrowser.SelectionPattern = "*.obj";
        m_fileBrowser.DirectoryImage = m_directoryImage;
        m_fileBrowser.FileImage = m_fileImage;
		
	}
 
    
    protected void FileSelectedCallback(string path) {
        m_fileBrowser = null;
        m_textPath = path;
        if (m_textPath != null) {
        	//GameObject.Find("Object Manager").SendMessage("LoadObject", m_textPath);
			GameObject.Find(WHERE_IS_ImportObject).SendMessage("nonweb_newObj", "file://"+m_textPath);
        }
    }
    */
}
