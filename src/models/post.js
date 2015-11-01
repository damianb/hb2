//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

let util = require('util')

let async = require('async')

let tagModel = require('./tag')

let model = module.exports = function postModel(id) {
	let self = this

	// defaults
	this.id = id

	 // todo: mod queue when user auth is implemented
	this._status = model.STATUS.UNKNOWN
}

model.STATUS = {
	UNKNOWN: 0,
	QUEUE: 1,
	DENY: 2,
	SPAM: 3,
	ACCEPT: 4,
	LOCKED: 5
}

model.RATING = {
	UNKNOWN: 0,
	SAFE: 1,
	QUESTIONABLE: 2,
	EXPLICIT: 3,

// short forms
	U: 0,
	S: 1,
	Q: 2,
	E: 3
}