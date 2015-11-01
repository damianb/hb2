#!/usr/bin/env node
//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//

//
// /hb2.js
//
// this file merely handles clustering and worker management.
// worker code resides within src/worker.js
//
// this file does -not- contain any ES6 specific syntax, in order to avoid ES6 blowups
//

//
// todo:
//  look into forking another process to handle special daemons/workers?
//  error logging/handling from within the master
//  pm2 support?
//
var cluster = require('cluster'),
	os = require('os')

var config = require('config')

// todo remove - this is a HACKY SOLUTION :(
if(process.version.match(/^v0\./)) {
// process.release is currently (iojs v3.0) iojs-specific unfortunately
// if(!process.release || process.release.name !== 'io.js') {
	console.log('not running a capable version of node, terminating')
	process.exit(1)
}

var maxWorkers = parseInt(config.get('app.maxWorkers') || Math.floor(os.cpus().length * 0.75))

if(cluster.isMaster) {
	var errMsg = function() {
		console.error('Worker not responding!')
	}

	var timeouts = []

	cluster.on('fork', function(w) {
		timeouts[w.id] = setTimeout(errMsg, 5000)
	})

	cluster.on('listening', function(w, address) {
		clearTimeout(timeouts[w.id])
	})

	cluster.on('exit', function(w, code, signal) {
		console.log('worker %d has died (%s)', w.process.pid, signal || code)
		cluster.fork() // replace the dead worker
	})

	// cluster master. maybe we should provide a repl for monitoring workers? Idk.
	for(var i = 0; i < maxWorkers; i++) {
		cluster.fork()
	}
} else {
	// cluster worker. pass it off to the peon code.
	var worker = require('./src/worker')
	var ripple = worker(cluster, config)
		.run()
}
