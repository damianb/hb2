//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

//
// controller 'helpers'
// 	these helper fns will be responsible for making sure controllers have global "variables"
// 	available to them, for things such as site-wide links, etc.
// 	plus utility fns like pagination and such.
//

let pkg = require('../../package.json')

let helpers = {
	paginator: function(ctx) {
		// todo
	},
	header: function(ctx) {
		// todo
	},
	footer: function(ctx) {
		// todo
	}
}

module.exports = function *controllerHelper(next) {
	let router = this.router
	this.cUtil = helpers

	// define global application tpl variables
	this.templateVars('app', {
		version: pkg.version,
		name: 'hb2',
		copyright: 'copyright &copy; 2015 Damian Bushong',
		admin: 'katana@odios.us', // todo config option? admin contact email
		expose: this.flashing
	})

	this.templateVars('nav', {
		header: {
			// key: value => links key: human readable string
			index: 'Home',
			about: 'About',
		}
	})

	this.templateVars('links', {
		index: router.url({ controller: 'site', action: 'index' }),
		about: router.url({ controller: 'site', action: 'about' }),
	})

	yield next
}
