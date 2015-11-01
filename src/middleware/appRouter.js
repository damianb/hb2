//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

let path = require('path'),
	fs = require('fs')

let debug = require('debug')('app:appRouter')

module.exports = function *appRouter(next) {
	this.trace('router')
	this.match = this.router.first(this.url, this.method)
	if(this.match === false) {
		debug('http(404): file not found [%s %s]', this.method, this.url)
		this.throw('Not found', 404)
	}

	// todo - move to async call
	let file = path.join(__dirname, '/../controllers/', this.match.controller + '.js')
	if(!fs.existsSync(file)) {
		debug('http(500): invalid controller specified [%s.js]', this.match.controller)
		this.throw('Invalid controller', 500)
	}

	let controller = require(file)
	if(typeof controller[this.match.action] !== 'function') {
		debug('http(500): invalid action specified [%s.%s]', this.match.controller, this.match.action)
		this.throw('Invalid controller action', 500)
	}

	this.trace('run-controller')
	// handoff to the controller for now.
	yield controller[this.match.action]
	this.trace('post-controller')
}