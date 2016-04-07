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

// todo: remove hardcoded upload path
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
let rollbackMarkers = {
	transaction: false,
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
		file.ext = '.' + file.meta.format.toLowerCase()
		file.filename = path.join(file.path, file.sha256 + file.ext)

		// copy the file
		let rs = fs.createReadStream(filename),
			ws = fs.createWriteStream(file.filename),
			alreadyCalled = false

		let streamCallback = function(err) {
				if(!alreadyCalled) {
					alreadyCalled = true
					callback(err)
				} else {
					rollbackMarkers['main'] = file.filename
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
	function(file, callback) {
		// BEGIN TRANSACTION!
		db.query('START TRANSACTION', function(err, rows) {
			if(err) return callback(err)

			rollbackMarkers['transaction'] = true
			callback(null, file)
		})
	}
	function(file, wCallback) {
		// insert image information into the database in a strategic and completely sane manner.
		// filename abc/def/abcdefgeh.ext

		async.waterfall({
			post: function(callback) {
				db.query(`INSERT INTO post (status, rating, submitter, md5, sha1, sha256)
						VALUES (:status, :rating, :submitter, :md5, :sha1, :sha256)`,
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
				db.query(`INSERT INTO image (status, type, post_id, filename, md5, sha1, sha256, width, height, size)
						VALUES (:status, :type, :postId, :filename, :md5, :sha1, :sha256, :width, :height, :filesize)`,
					{
						status: file.status,
						type: 1, // type 1 = full size image
						postId: postId,
						filename: file.sha256 + file.ext,
						md5: file.md5,
						sha1: file.sha1,
						sha256: file.sha256,
						width: file.meta.width,
						height: file.meta.height,
						filesize: file.meta.size
					}, function(err, rows) {
						if(err) return callback(err)

						callback(null, postId)
					}
				)
			},
			elimTags: function(postId, callback) {
				// finding the tags we don't already have in the database, in order to create them
				let placeholders = Array(file.tags.length).fill('?').join(', '),
					tagstoCreate = []
				db.query(util.format('SELECT title FROM tag WHERE title IN(%s)', placeholders), file.tags, { useArray: true }, function(err, rows) {
					if(err) return callback(err)

					rows.forEach(function(row) {
						if(file.tags.indexOf(row[0])){
							tagsToCreate.push(row[0])
						}
					})
					callback(null, postId, tagsToCreate)
				})
			},
			addTags: function(postId, tagsToCreate, callback) {
				// in order to handle this...somewhat sanely, we're going to have to dynamically build the VALUES part of the sql statement.
				// ...not to worry, we're only making placeholders for everything in the end.
				let placeholders = []
				for(let i = 0; i < tagsToCreate.length; i++) {
					placeholders.push('(?, 1)') // tag title placeholder, tag.TYPE.GENERAL
				}
				placeholders = placeholders.join(', ')
				db.query(util.format('INSERT INTO tag (title, type) VALUES %s', placeholders), tagsToCreate, function(err, rows) {
					if(err) return callback(err)

					callback(null, postId)
				})
			},
			addXrefs: function(postId, callback) {
				//
				// here we're actually inserting xrefs into the post_tag table, making the blind assumption that
				//  we already have the correct tag table entries existing here (because of the previous step) and that nobody is being left behind
				//
				// you know what they say about assumptions - ASSUMPTIONS MAKE THE WORLD GO ROUND! \o/
				//
				let placeholders = Array(file.tags.length).fill('?').join(', '),
					bindParams = [postId].concat(file.tags).concat(postId).concat(file.tags)
				db.query(util.format(`
					INSERT IGNORE INTO post_tag (tag_id, post_id)
					(
						SELECT t.id, ?
						FROM tag t
						WHERE
							t.title IN(%s)
							AND t.type <> 6
					)
					UNION DISTINCT
					(
						SELECT t.id, ?
						FROM tag t
						JOIN tag_alias a
							ON t.id = a.tag_id
						WHERE
							a.title IN(%s)
					)`, placeholders, placeholders), bindParams, function(err, rows) {
						if(err) return callback(err)

						callback(null, postId)
					}
				)
			}
		}, function(err, postId) {
			if(err) return wCallback(err)

			// stuff the postId into the file object, it's ours now
			file.postId = postId

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

		callback(null, file)
	},
	function(file, callback) {
		// Everything going to plan. Nope, nothing will go wrong at this point.
		// (famous last words)
		db.query('COMMIT', function(err, rows) {
			if(err) return callback(err)

			callback(null, file)
		})
	}
], function(err, file) {
	if(err) {
		console.error(err)

		// "ROLLBACK. OH GOD, ROLLBACK."
		if(rollbackMarkers['transaction'] === true) {
			db.query('ROLLBACK')
		}
		// destroy created image files if we created them
		if(rollbackMarkers['main'] !== false) {
			fs.unlinkSync(rollbackMarkers['main'])
		}
		if(rollbackMarkers['sample'] !== false) {
			fs.unlinkSync(rollbackMarkers['sample'])
		}
		if(rollbackMarkers['thumb'] !== false) {
			fs.unlinkSync(rollbackMarkers['thumb'])
		}

		process.exit(1)
	}

	// I...I guess it worked at this point? o_O;
})