/**
 * @projectDescription Tiny HTML5 audio library.
 * @author  David VanDusen
 * @version 1.0
 */
define(function () {
	"use strict";

	/**
	 * Global object associating file extensions with MIME types.
	 */
	var MIME_TYPES = {
			"ogg" : "audio/ogg",
			"mp3" : "audio/mpeg",
			"wav" : "audio/wav",
			"*"   : "audio/*"
		};

	/**
	 * Helper function that returns the MIME type associated with an audio file.
	 *
	 * @param  {String} src Audio file path
	 * @return {String}     The audio file's MIME type
	 */
	function getMimeType(src) {
		return MIME_TYPES[src.split(".").pop()] || MIME_TYPES["*"];
	}

	/**
	 * Constructs an object with the ability to play sound. It can be passed
	 * strings indicating source URLs for different audio formats. The
	 * recommended formats are Ogg Vorbis, MP3, and WAV.
	 *
	 * @constructor
	 * @classDescription     Object with the ability to play audio in a web page
	 * @param  {String}  ... Optional. URLs of audio files
	 * @return {Sound}       Returns a Sound object
	 */
	function Sound() {
		var i;

		/**
		 * The HTML5 audio element.
		 *
		 * @property {HTMLAudioElement}
		 * @type     {Object}
		 */
		this.el = document.createElement("audio");

		/*
		 * If the constructor is passed arguments, it forwards each to
		 * loadSource to be added as a source element to the audio element.
		 * Additional sources cann be added later by calling loadSource.
		 */
		if (arguments.length) {
			for (i = 0; i < arguments.length; i++) {
				this.loadSource(arguments[i]);
			}
		}
	}

	/**
	 * Loads an audio source.
	 *
	 * @method
	 * @param     {String}    src URL of audio file
	 * @exception {TypeError}     Throws a TypeError if src is not a string
	 */
	Sound.prototype.loadSource = function (src) {
		if (typeof src !== "string") { throw new TypeError(); }
		var source = document.createElement("source");
		source.setAttribute("src", src);
		source.setAttribute("type", getMimeType(src));
		this.el.appendChild(source);
	};

	/**
	 * Plays the sound.
	 *
	 * @method
	 */
	Sound.prototype.play = function () {
		this.el.play();
	};

	/**
	 * Pauses the sound.
	 *
	 * @method
	 */
	Sound.prototype.pause = function () {
		this.el.pause();
	};

	return Sound;

});
