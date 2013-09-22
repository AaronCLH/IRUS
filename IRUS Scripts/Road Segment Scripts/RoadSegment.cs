using UnityEngine;
using System.Collections;

public class RoadSegment : MonoBehaviour {
	
	private Vector3 [] roadVertices;
	private Vector3 [] roadTriangles;	
	private float roadWidth;
	private float roadWidthOccupied;
	private int arraySize;
	private GameObject [] prefabArray;
	private string [] prefabNames;
	private float [] widthsArray;
	private bool [] statusArray;
	private int [,] acceptableRanges;
	
	private class SpecializedOptions
	{
		string [] Names;
		int [] Values;
	}
	
	// Use this for initialization
	void Start () {
	
	}
	
	// Update is called once per frame
	void Update () {
	
	}
	
	
	int FindIndex( string prefabName){
		
		for (int i = 0 ; i < arraySize ; i++ ){
			if (prefabNames[i] == prefabName) return i;
		}
		return -1;
	}
				
	void ResizeObject( string prefabName, float newWidth){
		int index = FindIndex(prefabName);
		float oldWidth = widthsArray[index];
		if ( newWidth >= acceptableRanges[index, 0] && newWidth <= acceptableRanges[index, 1]){
			if (roadWidthOccupied + newWidth - oldWidth <= roadWidth){
				// Change Width along Road
			}
			else Debug.Log("Please Free up Space");

		}
		else Debug.Log("Please Enter An acceptable Width");
		return;
	}
		
		
		
		
		
		
		
		
		
		
}
