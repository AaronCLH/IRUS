// SetbacksGUITexture - A small script for those GUITextures used in the Line Labelling UI

#pragma strict

static var SelectedTexture : GameObject; // The texture GameObject which is selected (really? is that what this is?)

public var textures : Texture2D[] = new Texture2D[3]; // An array of possible textures for the GUITexture. This goes in the order
													  // Normal, Hover, Active
private var hovering : boolean = false;		// Is the mouse hovering over this GameObject?

function Update() {
	if ((SelectedTexture != gameObject) && (gameObject.guiTexture.texture != textures[0]) && !hovering) {
		// If the SelectedTexture is not this game object, the texture of this game object's GUITexture is not the Normal 
		// texture, and the mouse is not hovering over this game object, then switch the texture to the Normal one.
		changeTexture(textures[0]);
	}
}

function OnEnable() { // Default SelectedTexture to null and the texture of this gameobject to the Normal one
	SelectedTexture = null;
	changeTexture(textures[0]);
}

function OnMouseDown() { // Switch the texture to the active one
	SelectedTexture = gameObject;
	changeTexture(textures[2]);
}

function OnMouseOver() { 
	hovering = true;
	if (SelectedTexture != gameObject) { // switch the texture to the normal one only if this gameobject is not active
		changeTexture(textures[1]);
	}
}

function OnMouseExit() {
	hovering = false;
}

public function changeTexture(tex : Texture2D) {
	gameObject.guiTexture.texture = tex;
}