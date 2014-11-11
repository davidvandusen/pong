/**
 * @projectDescription An object containing a list of the currently depressed keys
 * @author  David VanDusen
 * @version 0.1
 */
define(function () {
	"use strict";

	var keyboard = {
		downKeys : {},
		onkeydown : function (evt) {
			if (!this.downKeys[evt.keyCode]) {
				this.downKeys[evt.keyCode] = true;
			}
		},
		onkeyup : function (evt) {
			if (evt.keyCode in this.downKeys) {
				delete this.downKeys[evt.keyCode];
			}
		}
	};

	document.addEventListener("keydown", function (evt) { keyboard.onkeydown(evt); }, false);
	document.addEventListener("keyup", function (evt) { keyboard.onkeyup(evt); }, false);

	return keyboard;
});