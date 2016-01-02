//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

//
// gallery controllers
//

let path = require('path'),
	util = require('util')

let async = require('async'),
	base62 = require('base62.js')

let postModel = require('./../models/post'),
	tagModel = require('./../models/tag')


function *searchController() {
	let router = this.router,
		uri = this.match

	this.dynamic = true

	this.setTemplate('list_posts.jade')
	this.type = 'html'
}

function *latestController() {
	let	router = this.router,
		uri = this.match

	let pageSize = 24,
		page = !!(uri.page) ? parseInt(uri.page) - 1 : 0,
		offset = page * pageSize
	this.body = util.format('page %d, limit %d offset %d', page, pageSize, offset)

	// build links like so:
	/*
	var links = {
		about: router.url({
				controller: 'site',
				action: 'about'
			})
	}
	*/
	this.dynamic = true
	//this.lastModified = '0'
	//throw new Error('CRIT FAIL OMG')

	//this.setTemplate('latest.jade')
	this.type = 'html'

	//this.body = 'test'
}

function findByTags(db, tags, limit, offset) {
	// we'll be splitting tags into three "categories"
	//  - positive tags (find posts with tag XYZ)
	//  - negative tags (find posts without tag XYZ)
	//  - meta-tags (find posts that meet certain conditions...such as an image MD5)

	tags = tagModel.orgTags(tags)

	function queryPTagIDs(callback) {
		let query = '',
			params = [],
			placeholders = ''

		//
		// note: t.type <> 6 check is to verify we're not hitting an aliased tag.
		//  this should not happen, but it is a safety just in case it does (preventing race conditions!)
		//
		// also note: these are split up into two, because we've got to do the query twice (once for pTags, once for nTags)
		//  yes, it's duplicated code, but we're modifying the query directly with the placeholders, no way around it.
		//
		if(tags.pTags.length > 0) {
			query = `
				(
					SELECT t.id as tag_id
					FROM tag t
					WHERE
						t.title IN(%s)
						AND t.type <> 6
				)
				UNION DISTINCT
				(
					SELECT t.id as tag_id
					FROM tag t
					JOIN tag_alias a
						ON t.id = a.tag_id
					WHERE
						a.title IN(%s)
				)
			`

			placeholders = Array(tags.pTags.length).fill('?').join(', ')
			query = util.format(query, placeholders, placeholders)
			params = [].concat(tags.pTags).concat(tags.pTags)
			// todo - get pTagIDs, using npm package mariasql
		} else {
			callback(null, [])
		}
	}

	function queryNTagIDs(callback) {
		let query = '',
			params = [],
			placeholders = ''

		if(tags.nTags.length > 0) {
			query = `
				(
					SELECT t.id as tag_id
					FROM tag t
					WHERE
						t.title IN(%s)
						AND t.type <> 6
				)
				UNION DISTINCT
				(
					SELECT t.id as tag_id
					FROM tag t
					JOIN tag_alias a
						ON t.id = a.tag_id
					WHERE
						a.title IN(%s)
				)
			`

			placeholders = Array(tags.nTags.length).fill('?').join(', ')
			query = util.format(query, placeholders, placeholders)
			params = [].concat(tags.nTags).concat(tags.nTags)
			// todo - get nTagIDs, using npm package mariasql
		} else {
			callback(null, [])
		}
	}

	// because mariasql isn't promise-y yet, we've got to juggle multiple queries via async
	//  or face an eternal future in CALLBACK HELL. DUN DUN DUNNN.
	async.parallel({
		pTagIDs: queryPTagIDs,
		nTagIDs: queryNTagIDs
	}, function(err, results) {
		if(err) throw err

		findByTagIDs(db, results.pTagIDs, results.nTagIDs, tags.mTags, limit, offset)
	})
}

function findByTagIDs(db, pTagIDs, nTagIDs, mTags, limit, offset) {
	let metaTags = [],
		postQuery = '',
		countQuery = '',
		queryBody = '',
		params = [],
		placeholders = ''

	metaTags = buildMetaWhereQuery(mTags)
	// metaTags.sql contains dynamically generated SQL and placeholders for param binding
	// metaTags.params contains the associated parameters to bind.

	//
	// note: if we have any pTagIDs, nTagIDs...we have to use a vastly different query
	// unfortunately, this alternate query results in worse perf.
	// i hate you, sql. ;-;
	//
	if(pTagIDs.length > 0 && nTagIDs.length > 0) {
		// FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
		// worst case scenario - we have tags to search for AND tags to avoid. sigh. picky users, I swear.
		queryBody = `
			LEFT OUTER JOIN (
				SELECT pt.post_id
				FROM post_tag pt
				JOIN tag t
					ON pt.tag_id = t.id
				WHERE t.id IN (%s)
			) notag
				ON p.id = notag.post_id
			INNER JOIN (
				SELECT pt.post_id
				FROM post_tag pt
				JOIN tag t
					ON pt.tag_id = t.id
				WHERE t.id IN (%s)
				GROUP BY pt.post_id
					HAVING COUNT(t.id) = %d
			) yestag
				ON p.id = yestag.post_id
			WHERE notag.post_id IS NULL
			%s
		`

		if(metaTags.sql.length > 0) {
			metaTags.sql = ' AND ' + metaTags.sql
		}

		// yes, this nTags.length is being used directly in-query.
		// it's an int, will always be an int, and should not be worred about.
		queryBody = util.format(queryBody,
			Array(nTagIDs.length).fill('?').join(', '),
			Array(pTagIDs.length).fill('?').join(', '),
			parseInt(nTags.length),
			metaTags.sql
		)
		params = []
			.concat(nTagIDs)
			.concat(pTagIDs)
			.concat(metaTags.params)
	} else if(pTagIDs.length > 0) {
		// we don't need to use The Thing Of Great Evil.
		// better scenario - we only need to search for certain tags, nothing to avoid here.
		queryBody = `
			JOIN post_tag pt
				ON pt.post_id = p.id
			JOIN tag t
				ON pt.tag_id = t.id
			WHERE t.id IN(%s)
			%s
			GROUP BY p.id
				HAVING COUNT(t.id) = %d
		`

		if(metaTags.sql.length > 0) {
			metaTags.sql = ' AND ' + metaTags.sql
		}

		queryBody = util.format(queryBody,
			Array(pTagIDs.length).fill('?').join(', '),
			metaTags.sql,
			parseInt(nTags.length)
		)
		params = []
			.concat(pTagIDs)
			.concat(metaTags.params)
	} else if(nTagIDs.length > 0) {
		// only tags to avoid here
		queryBody = `
			LEFT OUTER JOIN (
				SELECT pt.post_id
				FROM post_tag pt
				JOIN tag t
					ON pt.tag_id = t.id
				WHERE t.id IN (%s)
			) notag
				ON p.id = notag.post_id
			WHERE notag.post_id IS NULL
			%s
		`

		if(metaTags.sql.length > 0) {
			metaTags.sql = ' AND ' + metaTags.sql
		}

		queryBody = util.format(queryBody,
			Array(nTagIDs.length).fill('?').join(', '),
			Array(pTagIDs.length).fill('?').join(', '),
			parseInt(nTags.length),
			metaTags.sql
		)

		params = []
			.concat(nTagIDs)
			.concat(metaTags.params)
	} else {
		// meta tags only...or nothing. either is okay.
		// yes, the queryBody is...pretty much nothing, up until metaTags are introduced.
		queryBody = '%s'

		if(metaTags.sql.length > 0) {
			metaTags.sql = ' WHERE ' + metaTags.sql
		}

		queryBody = util.format(queryBody, metaTags.sql)
		params = [].concat(metaTags.params)
	}

	/**
	 * safe assumptions to make at this point:
	 *  we have a queryBody, we have an array of params now
	 *
	 * limit/offset may or may not be safe. query needs to be modified
	 *  to directly inject limit/offset into the query. we can't parameterize that part, alas.
	 *
	 * we'll start by building the countQuery and postQuery based off of queryBody.
	 * we've got to have two queries here in order to obtain an overall count of matches, which is
	 *  used for handling pagination (and is also presented to the user).
	 *
	 * countQuery only hits the post table (rather than vw_post) to reduce the number of overall joins.
	 */
	postQuery = `
		SELECT p.*
		FROM vw_post p
	` + queryBody

	countQuery = `
		SELECT COUNT(DISTINCT p.id)
		FROM post p
	` + queryBody

	limit = parseInt(limit)
	offset = parseInt(offset)

	// don't allow irrational offsets or limits.
	// limits will also be bounded to a maximum of 100.
	//  may change in the future via config val.
	if(offset < 0) {
		offset = 0
	}

	if(limit < 4) {
		limit = 4
	} else if(limit > 100) {
		limit = 100
	}

	postQuery += `
		LIMIT %d
		OFFSET %d
	`
	postQuery = util.format(postQuery, limit, offset)

	//
	// at this point, our ugly behemoth query is ready to fire.
	//  it will *only* grab post/image/submitter data, however, through the view vw_post.
	//
	// because of how data structure differs, tags for each/all posts that we'll be pulling up
	//  must be queried via *another* query, then associated with their appropriate posts.
	//
}

function buildMetaWhereQuery(mTags) {
	let ret = {
		sql: [],
		params: []
	}

	mTags.forEach(function(t, i) {
		//
		// the following is here in case we need to (at some point in the future)
		//  limit the overall number of meta-tags allowed in a single query.
		//  abuse of meta-tags in searches has the potential to create a denial of service, so...
		//
		// for now, it's set to something unreasonably high, high enough an honest user shouldn't encounter it.
		//
		if(i > 10) {
			return
		}

		let meta = t.split(':').shift(),
			neg = !!(meta.charAt(0) === '-')

		t = t.join(':')
		if(neg) {
			meta = meta.substr(1)
		}

		switch(meta) {
			// md5, sha1, and sha256 will be expected to be specified as hex
			case 'md5':
				if(!/^[\dA-Fa-f]{32}$/.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.md5 <> ?' : 'p.md5 = ?')
				ret.params.push(t)
			break

			case 'sha1':
				if(!/^[\dA-Fa-f]{40}$/.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.sha1 <> ?' : 'p.sha1 = ?')
				ret.params.push(t)
			break

			case 'sha256':
				if(!/^[\dA-Fa-f]{64}$/.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.sha256 <> ?' : 'p.sha256 = ?')
				ret.params.push(t)
			break

/*
			case 'user':
			case 'u':
				// todo - pull username validation regex from userModel, if/when it ever exists
				if(!/^\w+[\w\-\_]+$/.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.submitter_name <> ?' : 'p.submitter_name = ?')
				ret.params.push(t)
			break

			case 'userid':
			case 'uid':
				if(!/^\d+$/.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.submitter <> ?' : 'p.submitter = ?')
				ret.params.push(t)
			break
*/

			case 'rating':
			case 'r':
				if(!/^(safe|questionable|explicit|s|q|e)$/i.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.rating <> ?' : 'p.rating = ?')
				ret.params.push(postModel.RATING[t.toUpperCase()])
			break

			case 'width':
			case 'height':
			case 'score':
			case 'w':
			case 'h':
			case 's':
				let re = /^(<|=|>|<=|>=)([0-9]+)$/,
					res = null,
					column = null

				//
				// < re.exec('>=1000')
				// > Array [ ">=1000", ">=", "1000" ]
				//
				if(!(res = re.exec(t)) === null) {
					return
				}

				// we deliberately ignore neg for width/height/score meta-tags.
				// if you want to negate it, do it the right way.
				//   read: NEG of !(width<800) is (width>=800)
				if(neg) {
					return
				}

				// hack to save duplication of a bunch of lines - handling width, height, score in the same case
				if(meta.charAt(0) === 'w') {
					column = 'width'
				} else if(meta.charAt(0) === 'h') {
					column = 'height'
				} else if(meta.charAt(0) === 's') {
					column = 'score'
				} else {
					return
				}

				column = (meta.charAt(0) === 'w') ? 'width' : 'height'

				// yes, it's a slight bit risky allowing the user to specify the comparison operator,
				// but there's no way around it. it's on a whiteliste via regex, at the very least.
				ret.sql.push('p.' + column + ' ' + res[1] + ' ?')
				ret.params.push(res[2])
			break

			// checking to see if the user is allowed to specify a status meta-tag in the query should be done at a higher level, preferably in a controller.
			case 'status':
				if(!/^(unknown|queue|deny|spam|accept|locked)$/i.test(t)) {
					return
				}

				ret.sql.push(neg ? 'p.status <> ?' : 'p.status = ?')
				ret.params.push(postModel.STATUS[t.toUpperCase()])
			break

			case 'id':
				if(!/^[0-9]+$/i.test(t)) {
					return
				}

				// while it does't seem outright sane to allow negation of IDs, we'll allow it.
				ret.sql.push(neg ? 'p.id <> ?' : 'p.id = ?')
				ret.params.push(t)
			break
		}
	})

	// collapse the SQL conditions
	ret.sql = ret.sql.join(' AND ')
	return ret
}

module.exports = {
	main: searchController,
	latest: latestController
}
