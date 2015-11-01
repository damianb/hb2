//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

let path = require('path')

let jade = require('jade')

module.exports = function *templateHandler(next) {
	let _template = this._template = {
		tplFile: false,
		tplVars: {
			'global':{}
		}
	}

	// protip: specify false to not use a template at all
	this.setTemplate = function(tplName) {
		_template.tplFile = tplName
	}

	// setting template vars under a specific namespace.
	// because we hate global vars, they have a special namespace. just because. :|
	this.templateVars = function(tplNamespace, tplObj) {
		if(arguments.length === 0) {
			throw new Error('Invalid call to ctx.templateVars - no parameters provided')
		} else if(arguments.length === 1) {
			tplObj = tblNamespace
			tblNamespace = 'global'
		}

		// determine if namespace exists, if not, merge tplObj entry into existing obj
		// note, merger is not recursive, and any global vars will be smothered if they collide with a namespace name
		// (because f globals)
		if(!!_template.tplVars[tplNamespace]) {
			for(let tplProp in tplObj) {
				if(tplObj.hasOwnProperty(tplProp)) {
					_template.tplVars[tplNamespace][tplProp] = tplObj[tplProp]
				}
			}
		} else {
			_template.tplVars[tplNamespace] = tplObj
		}
	}

	yield next

	this.trace('templating')
	if(this.response.is('html') && !!this._template.tplFile) {
		// load appropriate template file
		let tplFile = path.join(__dirname, '../../', 'views', this._template.tplFile)

		// construct template variables, call jade and render into this.body
		// todo: theoretically this should still have all globals in global.varname and that if they're smothered because of a
		// collision with a namespace, they should not be overwritten there; need to verify that this is the case
		let tplCtx = {}
		for(let ns in this._template.tplVars['global']) {
			if(this._template.tplVars['global'].hasOwnProperty(ns)) {
				tplCtx[ns] = this._template.tplVars['global'][ns]
			}
		}
		for(let ns in this._template.tplVars) {
			if(this._template.tplVars.hasOwnProperty(ns)) {
				tplCtx[ns] = this._template.tplVars[ns]
			}
		}

		// exposeInfo makes both everything pretty and makes everything really...exposed. use at risk.
		let exposeInfo = !!this.config.get('app.exposeInfo'),
			cacheTemplates = !!this.config.get('app.cacheTemplates')

		this.body = jade.compileFile(tplFile, {
			filename: this._template.tplFile, // do not use tplFile, use this._template.tplFile to avoid including the entire path
			compileDebug: exposeInfo,
			pretty: exposeInfo,
			cache: cacheTemplates
		})(tplCtx)
		this.trace('template-run')
	}
}