/**
 * @projectDescription A tiny library for binding and triggering events on objects
 * @author  David VanDusen
 * @version 1.0
 */
define(function () {
	"use strict";

	/**
	 * @constructor
	 * @classDescription  Allows descendants to have arbitraty events bound and triggered
	 * @return {Bindable} Returns a Bindable object
	 */
	function Bindable() {
		this.events = {};
	}

	/**
	 * Binds a named event or collection of named events to a callback function.
	 *
	 * @method
	 * @param     {Object}    eventNames String or array of strings naming events
	 * @param     {Function}  fn         Function to call when the named events are fired
	 * @exception {TypeError}            Throws a TypeError if eventNames is not a string or array of strings
	 */
	Bindable.prototype.bind = function (eventNames, fn) {
		var i;
		if (typeof eventNames === "string") {
			eventNames = [eventNames];
		}
		if (!(eventNames instanceof Array)) { throw new TypeError(); }
		for (i = 0; i < eventNames.length; i++) {
			if (typeof eventNames[i] !== "string") { throw new TypeError(); }
			if (this.events[eventNames[i]] === undefined) {
				this.events[eventNames[i]] = [];
			}
			this.events[eventNames[i]].push(fn);
		}
	};

	/**
	 * Fires a named event, calling each callback function in turn.
	 *
	 * @method
	 * @param   {String} eventName Name of the event to trigger
	 * @remarks Returns without error if the event has no callbacks
	 */
	Bindable.prototype.triggerEvent = function (eventName) {
		var i;
		if (this.events === undefined || this.events[eventName] === undefined) {
			return;
		}
		for (i = 0; i < this.events[eventName].length; i++) {
			this.events[eventName][i](this);
		}
	};

	return Bindable;

});