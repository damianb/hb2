//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

let model = module.exports = function tagModel(id) {
	let self = this

	// defaults
	this.id = id
	this._type = model.TYPE.GENERAL;

	this.loadTag = function() {
		// todo
	}

	this.initTag = function(tagData) {
		// todo
	}

	this.getType = function(humane) {
		if(!!humane) {
			switch(self._type) {
				default:
				case model.TYPE.GENERAL:
					return 'general'
				case model.TYPE.CHARACTER:
					return 'character'
				case model.TYPE.AUTHOR:
					return 'author'
				case model.TYPE.UNIVERSE:
					return 'universe'
				case model.TYPE.MEDIUM:
					return 'medium'
				case model.TYPE.ALIAS:
					return 'alias'
			}
		} else {
			return self._type;
		}
	}

	this.getDescription = function() {
		switch(self._type) {
			default:
			case model.TYPE.GENERAL:
				return 'general use tag'
			case model.TYPE.CHARACTER:
				return 'character/person tag'
			case model.TYPE.AUTHOR:
				return 'author tag'
			case model.TYPE.UNIVERSE:
				return 'anime/manga series tag'
			case model.TYPE.MEDIUM:
				return 'medium/art form tag'
			case model.TYPE.ALIAS:
				return 'aliased tag'
		}
	}
}

model.TYPE = {
	UNKNOWN: 0,
	GENERAL: 1,
	CHARACTER: 2,
	AUTHOR: 3,
	UNIVERSE: 4,
	MEDIUM: 5,
	ALIAS: 6
}

// short forms included
model.METATAGS = [
	'md5',
	'sha1',
	'sha256',

	'rating',
	'r',

	'width',
	'height',
	'w',
	'h',

//	'user',
//	'u',
//	'userid',
//	'uid',

	'score',
	's',

	'status',

	// we may very well never implement sort. tricky thing to handle.
	//'sort',
	'id'
]

model.resolveTags = function() {
	let query = `
		SELECT t.*, a.title as old_tag
		FROM tag t
		LEFT JOIN tag_alias a
			ON t.id = a.tag_id
		WHERE a.title in(%s)
	`
	// todo
	//R::$f->begin()
	// 	->select('t.*, a.title as old_tag')->from('tag t')
	// 	->left_join('tag_alias a on t.id = a.tag_id')
	// 	->where('a.title in('  . R::genSlots($tags) . ')');
	// array_walk($tags, function($value, $key) { R::$f->put($value); });
}

/**
 * organizes tags out into three specific sections for ease of use, querying, etc.
 */
model.orgTags = function(tags) {
	let ret = {
		mTags: [],
		pTags: [],
		nTags: []
	}

	tags.forEach(function(t) {4
		let meta = t.split(':').shift(),
			neg = false

		// handling both negative tags and negative meta-tags here.
		if(t.charAt(0) === 0) {
			neg = true
			meta = meta.subst(1)
		}

		// determine if we've got a legit metatag
		if(model.METATAGS.indexOf(meta) > -1) {
			ret.mTags.push(t)
		} else if(neg === true) {
			ret.nTags.push(t)
		} else {
			ret.pTags.push(t)
		}
	})

	return ret
}

//model.tagRegex = /\w+[\w\-\(\)\!\_\+\[\]]*/