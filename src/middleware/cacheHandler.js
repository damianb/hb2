//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//
'use strict'

/*
NOTE: this middleware will require some significant refactoring - likely after the primary structure for controllers (and how they interact with the app itself)
  has been defined further.
*/

/*
  note: this middleware will need to come almost immediately before the appRouter middleware.
  if we can precache the dates/times pages have been modified, we can then possibly short-circuit certain pages (this.dynamic === false) and avoid running the controller at all
  this would be a huge perf gain, but tricky to implement well.  controllers would, ideally, have to declare ALL assets somehow and then stat the files, checking mtime
  something to be done on startup possibly, or as a build task - build the "latest mtime" cache for each non-dynamic page

  either that, or just push all that off onto nginx.  not sure, probably overengineering the situation

  this tactic should def be used for dynamic pages though - combined with checking dates of dynamic content, we can at least save on bandwidth between user and server.
  if this method is chosen, would be easy to use on the non-dynamic pages as well
*/
module.exports = function *cacheHandler(next) {
  let now = Date.now()
  let lmc = 0
  // define the function _lastModifiedContent, whose sole purpose is to determine the "latest" time for all given content
  this._lastModifiedContent = function(date) {
    if(date > lmc) {
      lmc = date
    }
  }
  yield next

  let userLM = new Date(this.request['If-Modified-Since'])
  if(this.dynamic) {
    // todo - go by "latest updated content date"
  } else {
    // this.lastModified should be pulled from the last "site update", possibly the last time the controller was touched?
    if(userLM >= this.lastModified) {
      this.body = null
      this.status = 304
    }
  }
}