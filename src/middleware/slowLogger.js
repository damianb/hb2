//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

var debug = require('debug')('app:slowLogger')

// basic logger - todo, replace with something less verbose.
// possibly log long-running requests and ignore the rest?
module.exports = function *timeLogger(next) {
	let start = Date.now()
	yield next
	let total = Date.now() - start
	if(total > 200) {
		debug('slow request: %s %s - %sms', this.method, this.url, total)
	}/* else if(this.config.get('app.exposeInfo')) {
		debug('total request: %s %s - %sms', this.method, this.url, total)
	}*/
}