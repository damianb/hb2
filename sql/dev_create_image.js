//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

// builtins
let
	async = require('async'),
	config = require('config'),
	crypto = require('crypto'),
	fs = require('fs'),
	http = require('http'),
	mariasql = require('mariasql'),
	path = require('path'),
	sharp = require('sharp'),
	util = require('util')

// get build string to start
// $PROJECT_ROOT/.bsinf contains our build string to use
let buildFilePath = path.join(__dirname, '../', '.bsinf'),
	buildString = ''
try {
	fs.accessSync(buildFilePath, fs.R_OK)
	buildString = fs.readFileSync(buildFilePath, { encoding: 'utf-8' })
} catch(err) {
	// apparently bsinfo doesn't exist. Worst fucking idea ever, node - fs.access is absolutely bollocks. Absolutely awful.
}

console.log('loaded dev script - ' + buildString)
console.log('connecting to database...')

// deliberately using var here
var db = null

// let uploadPath = config.get('app.uploadPath')
let uploadPath = path.join(__dirname, '../', 'upload/')

// dump the first and second args (which should be "node scriptname.js")
let argv = process.argv
argv.shift()
argv.shift()

let filename = argv.shift()

console.log('attempting to load specified file')
try {
	if(!filename) {
		throw new Error('no file specified')
	}
	fs.accessSync(filename, fs.R_OK)
} catch(err) {
	console.error(util.format('specified file "%s" does not appear to exist or is not readable', filename))
	process.exit(1)
}

// we'll track whether or not files have been copied through this var, in case we need to roll back and unlink these files in case of an error.
let hasCreatedFiles = {
	main: false,
	sample: false,
	thumb: false
}

async.waterfall([
	function(wCallback) {
		// connect to the database - using a var declared earlier
		db = new mariasql({
			host: config.get('db.host'),
			port: config.get('db.port'),
			username: config.get('db.user'),
			password: config.get('db.password'),
			db: config.get('db.db'),
		})
		// todo: probably can just pass wCallback. test this later
		db.on('ready', function() {
			wCallback(null)
		})
		db.on('error', function(err) {
			wCallback(err)
		})
	},
	// get various image meta-elements needed for sql inserts
	function(wCallback) {
		async.parallel({
			original: function(callback) {
				callback(null, filename)
			},
			tags: function(callback) {
				// remaining argv elements should be assumed to be tags
				callback(null, argv)
			},
			status: function(callback) {
				callback(null, 4) // 4 = postModel.STATUS.ACCEPT
			},
			rating: function(callback) {
				callback(null, 0) // 1 = postModel.RATING.SAFE
			},
			md5: function(callback) {
				let hash = crypto.createHash('md5')
				hash.setEncoding('hex')

				let fd = fs.createReadStream(filename)
				fd.on('end', function() {
					hash.end()
					callback(null, hash.read())
				})
				fd.pipe(hash)
			},
			sha1: function(callback) {
				let hash = crypto.createHash('sha1')
				hash.setEncoding('hex')

				let fd = fs.createReadStream(filename)
				fd.on('end', function() {
					hash.end()
					callback(null, hash.read())
				})
				fd.pipe(hash)
			},
			sha256: function(callback) {
				let hash = crypto.createHash('sha256')
				hash.setEncoding('hex')

				let fd = fs.createReadStream(filename)
				fd.on('end', function() {
					hash.end()
					callback(null, hash.read())
				})
				fd.pipe(hash)
			},
			meta: function(callback) {
				sharp(filename)
					.metadata(function(err, metadata) {
						if(err) callback(err)
						let stats = fs.statSync(filename)

						callback(null, {
							width: metadata.width,
							height: metadata.height,
							format: metadata.format,
							size: stats.size // size in bytes
						})
					})
			}
		}, wCallback)
	},

	// basic image processing, filesystem interaction with main image
	function(file, callback) {
		let allowedFormats = [
			'jpeg',
			'gif',
			'png',
			'webm'
			// TIFF is something sharp can handle, but we won't allow it here. just because. no real reason.
		]

		if(allowedFormats.indexOf(file.meta.format.toLowerCase()) === -1) {
			return callback('invalid format specified')
		}
		file.path = path.join(uploadPath, file.sha256.substr(0,3), file.sha256.substr(3,3))
		file.fullName = path.join(file.path, file.sha256)
		file.ext = '.' + file.meta.format.toLowerCase()

		// copy the file
		let rs = fs.createReadStream(filename),
			ws = fs.createWriteStream(file.fullName + file.ext),
			alreadyCalled = false

		let streamCallback = function(err) {
				if(!alreadyCalled) {
					alreadyCalled = true
					callback(err)
				} else {
					callback(null, file)
				}
			}

		rs.on('error', streamCallback)
		ws.on('error', streamCallback)
		ws.on('close', function() {
			streamCallback(null, file)
		})
		rs.pipe(ws)
	},
	function(file, wCallback) {
		// todo
		// begin sql transaction
		// filename abc/def/abcdefgeh.ext

		async.waterfall({
			post: function(callback) {
				db.query('INSERT INTO post (status, rating, submitter, md5, sha1, sha256) VALUES (:status, :rating, :submitter, :md5, :sha1, :sha256)',
					{
						status: file.status,
						rating: file.rating,
						submitter: 1, // UID 1 = Anonymous
						md5: file.md5,
						sha1: file.sha1,
						sha256: file.sha256
					}, function(err, rows) {
						if(err) return callback(err)

						callback(null, rows.info.insertId) // rows.info.insertId will be the post_id of the newly inserted row
					}
				)
			},
			image: function(postId, callback) {
				// todo - insert into image table

				callback(null)
			},
			tag: function(callback) {
				// todo - insert into tag table (INSERT IGNORE kind of deal...)

				callback(null)
			},
			xref: function(callback) {
				// todo - insert into post_tag xref table

				callback(null)
			}
		}, function(err, res) {
			if(err) return callback(err)

			// the post insert above should result in the return of a postId...hopefully.
			file.postId = res.postId
			file.imageId = res.imageId

			wCallback(null, file)
		})
	},
	function(file, wCallback) {
		// todo
		// verify if we need to actually create a sample image, and if not skip this step
		// begin sql transaction
		// filename abc/def/abcdefgeh_sample.ext

		async.parallel({
			sharp: function(callback) {
				// todo - perform sharp resize of image

				callback(null)
			},
			image: function(callback) {
				// todo - insert into image table

				callback(null)
			}
		}, function(err, res) {
			if(err) return callback(err)

			file.sampleImageId = res.imageId

			wCallback(null, file)
		})
	},
	function(file, callback) {
		// todo
		// resize for thumbnail image
		// insert thumbnail image into image table
		// filename abc/def/abcdefgeh_thumb.ext
	}
], function(err, file) {
	if(err) {
		console.error(err)
		process.exit(1)
	}

	// todo
})