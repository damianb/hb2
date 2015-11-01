//
// project hb2
// ---
// @copyright (c) 2015 Damian Bushong <katana@odios.us>
// @license MIT License
//

var fs = require('fs'),
	path = require('path')

var gulp = require('gulp'),
	sloc = require('gulp-sloc'),
	git = require('gulp-git')

var pkg = require('./package.json')

gulp.task('sloc', function() {
	gulp.src([
		'./*.js',
		//'./public/**/*.js',
		// ^ client-side only, should restrict it to js files that are not third-party libs
		'./src/**/*.js'
		])
		.pipe(sloc())
})

gulp.task('buildid', function() {
	git.revParse({
		args: '--short HEAD',
		cwd: __dirname,
		quiet: true
	}, function(err, hash) {
		if(err) throw err
		var now = new Date(),
			pad = '00'

		var buildString = pkg.name + '::' + pkg.version + '::' + now.getUTCFullYear() + '-' +
			(pad + (now.getUTCMonth() + 1)).slice(-2) + '-' +
			(pad + now.getUTCDate()).slice(-2) +
			'::' + hash + "\n"

		fs.writeFileSync(path.join(__dirname, '/.bsinf'), buildString, { encoding: 'utf8' })
	})
})

gulp.task('default', function() {
	/*
		build a super-public dir containing all assets we'll need
		todo: overrides for bootstrap (it needs to pull out of the dist dir and supply us with css+js files)
	*/

	gulp.src('./src/public/**/*.{css,js,ico,jpg,jpeg,png,css.map,woff,woff2,ttf}')
		.pipe(gulp.dest('./public'))

	var bower = require('main-bower-files')
	var bowerNormalizer = require('gulp-bower-normalize')
	gulp.src(bower(), {base: './bower_components'})
			.pipe(bowerNormalizer({bowerJson: './bower.json', flatten: true}))
			.pipe(gulp.dest('./public/assets/'))
});