//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

//
// main-site controllers
//

let path = require('path')

function *indexController() {
	let	router = this.router,
		uri = router.match

	// build links like so:
	/*
	var links = {
		about: router.url({
				controller: 'site',
				action: 'about'
			})
	}
	*/
	this.dynamic = false
	//this.lastModified = '0'
	//throw new Error('CRIT FAIL OMG')

	this.setTemplate('index.jade')
	this.type = 'html'

	//this.body = 'test'
}

function *aboutController() {
	let router = this.router,
		uri = router.match

	// todo: make other things happen
}

function *termsController() {
	let router = this.router,
		uri = router.match

	// legalese should go here. this should, optionally, be a static page.
	this.body = 'blah blah blah blah blah'
}

module.exports = {
	index: indexController,
	about: aboutController
}
