//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

//
// gallery controllers
//

let path = require('path'),
	util = require('util')

function *latestController() {
	let	router = this.router,
		uri = this.match

	// build links like so:
	/*
	var links = {
		about: router.url({
				controller: 'site',
				action: 'about'
			})
	}
	*/
	this.dynamic = true
	//this.lastModified = '0'
	//throw new Error('CRIT FAIL OMG')

	this.setTemplate('latest.jade')
	this.type = 'html'
	console.dir(uri)

	//this.body = 'test'
}

function *aboutController() {
	let router = this.router,
		uri = this.match

	// todo: make other things happen
}

function *termsController() {
	let router = this.router,
		uri = this.match

	// legalese should go here. this should, optionally, be a static page.
	this.body = 'blah blah blah blah blah'
}

module.exports = {
	latest: latestController
}
