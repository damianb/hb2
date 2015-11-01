//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

// builtins
let crypto = require('crypto'),
	domain = require('domain'),
	fs = require('fs'),
	http = require('http'),
	path = require('path')

// externals
let debug = require('debug')('worker'),
	routeInfo = require(path.join(__dirname, '/routes.json'))

let barista = require('barista').Router,
	jade = require('jade'),
	koala = require('koala'),
	koaStatic = require('koa-static'),
	mariasql = require('mariasql')

// training the peon
function enclosure(cluster, config) {
	let worker = {}

	// instantiate koa/koala & expose it
	// todo:
	//  session secrets
	//  csrf secrets
	let app = worker.app = koala({
		security: {
			nosniff: true,
			xframe: true,
			xssProtection: true,
			//hsts: 1000 * 60 * 60 * 24 * 60, // 60 days
			// leaving hsts alone for now, too early to mess with it
		},
		session: {
			maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days (1 week)
		},
		fileServer: {
			root: 'assets/', // static file root dir
			hidden: false,
			index: false,
			maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days (2 weeks)
		}
	})

	let router = new barista

	// configure koa/koala
	worker.run = function() {
		app.name = 'hb2'
		app.proxy = !!config.get('app.proxied')

		let tracePlaceholder = '~~<MAGICTRACE>~~' // would be inserted into returned info containing full trace info
		let buildPlaceholder = '~~<MAGICBUILD>~~' // magicbuild would be replaced with build sha, page gen time, server "proc" hash
		let buildString = ''
		let traceInfo = {}

		// $PROJECT_ROOT/.bsinf contains our build string to use
		let buildFilePath = path.join(__dirname, '../', '.bsinf')
		if(fs.existsSync(buildFilePath)) {
			buildString = fs.readFileSync(buildFilePath, { encoding: 'utf-8' })
		}

		// all routes are defined in src/routes.json, except for "/"
		router
			.defer(function(urlParam, method) {
				// because barista has no support for "index" paths, we have to do something ugly here
				if(method !== 'GET' || urlParam !== '/') {
					return false
				} else {
					return { controller: 'site', action: 'index' }
				}
			})
		routeInfo.forEach(function(route) {
			router.match(route.pattern, route.type).to(route.to)
		})

		// attempt to connect to the database
		let db = new mariasql({
			host: config.get('db.host'),
			port: config.get('db.port'),
			username: config.get('db.user'),
			password: config.get('db.password'),
			db: config.get('db.db'),
		})

		// define this.* extensions
		app.use(function *initApp(next) {
			let exposeInfo = !!config.get('app.exposeInfo')
			if(exposeInfo && !this.id) {
				// for use with koa-trace - unnecessary if using koala
				this.id = crypto.randomBytes(12)
			}

			this.router = router
			this.config = config
			this.flashing = exposeInfo
			this.db = db
			this.trace('start')

			yield next
			// injecting trace info if desired in a context-aware manner
			if(exposeInfo) {
				if(this.response.is('html')) {
					let traceString = jade.compileFile(path.join(__dirname, '../', 'views', 'trace.jade'), {
						filename: 'trace.jade',
						compileDebug: true,
						pretty: true,
						cache: !!config.get('app.cacheTemplates')
					})({ traces: traceInfo })

					this.body = this.body
						.replace(buildPlaceholder, buildString)
						.replace(tracePlaceholder, traceString)
				} else if(this.response.is('json')) {
					// todo: verify if this is actually necessary
					if(typeof this.body !== 'object') {
						try {
							this.body = JSON.parse(this.body)
						} catch(e) {} // pass on this, I guess?
					}
					this.body['trace'] = traceInfo
				}
			} else {
				// do not expose anything, incl x-powered-by
				delete this.response.headers['x-powered-by']
			}
		})

		// dev/production error handler
		// dev error handling is passed off to koa-wince for pretty error handling (and verbosity)
		if(!config.get('app.exposeInfo')) {
			// todo: determine if we want to involve jade in the prod error handler, or hardcode the shit
			// also todo: identify how we want to store errors (possibly log to console, or even nedb logging into a flat file? give the user a UUID to reference?)
			app.use(require('./middleware/prodErrorHandler'))
		} else {
			app.use(require('koa-wince')('hb2 - fatal error'))
		}

		app.use(require('koa-static')(path.join(__dirname, '../', 'public')))
		app.use(require('./middleware/slowLogger'))
		// todo - tor blocking?
		// todo - shadowbanning? tarpitting?

		app.use(require('./middleware/templateHandler'))
		//app.use(require('./middleware/cacheHandler'))
		app.use(require('./middleware/controllerHelper'))
		app.use(require('./middleware/appRouter'))

		app.listen(config.get('app.port'))
		debug('worker listening on %d', config.get('app.port'))
		return worker
	}

	return worker
}
module.exports = enclosure
