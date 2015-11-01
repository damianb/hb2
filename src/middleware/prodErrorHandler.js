//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

module.exports = function *prodErrorHandler(next) {
	// pass
	yield next
	if(this.status > 400) {
		// handle status here
	}
}