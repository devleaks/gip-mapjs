var gulp = require('gulp');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var clean = require('gulp-clean');

gulp.task('concatjs', function() {
  return gulp.src([
	'node_modules/leaflet-realtime/dist/leaflet-realtime.js',
	'node_modules/beautifymarker/leaflet-beautify-marker-icon.js',
	'node_modules/leaflet-rotatedmarker/leaflet.rotatedMarker.js',
	'node_modules/leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.js',
	'node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.js',
	'node_modules/leaflet-canvasicon/leaflet-canvasicon.js',
	'node_modules/leaflet-search/dist/leaflet-search.src.js',
	'lib/leaflet-betterscale/L.Control.BetterScale.js',
	'node_modules/jsonpath-plus/dist/index-es.js',
	'node_modules/mustache/mustache.js',
	'node_modules/moment/moment.js',
	'node_modules/@turf/turf/turf.min.js',
	'node_modules/@mapbox/geojsonhint/geojsonhint.js',
	'node_modules/jquery/dist/jquery.min.js',
	'node_modules/renderjson/renderjson.js',
	'node_modules/peity/jquery.peity.js',
	'src/js/jquery.sieve.js',
	'src/js/tagsort.min.js',
	'src/js/sortElements.js',
	'src/js/jquery.growl.js',
	'src/js/parse_metar.js',
	'src/L-oscars-dashboard.js',
	'src/L-oscars-wire.js',
	'src/L-oscars-util.js',
	'node_modules/beautifymarker/leaflet-beautify-marker-icon.js'
    ])
    .pipe(concat('L-oscars-util.js'))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('concatcss', function () {
  return gulp.src([
//	'src/L-oscars-version.css',
	'node_modules/leaflet/dist/leaflet.css',
//	'node_modules/leaflet-pulse-icon/dist/L.Icon.Pulse.css',
	'node_modules/font-awesome/css/font-awesome.css',
	'node_modules/leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css',
	'node_modules/beautifymarker/leaflet-beautify-marker-icon.css',
	'node_modules/leaflet-sidebar-v2/css/leaflet-sidebar.css',
	'lib/leaflet-betterscale/L.Control.BetterScale.css',
	'node_modules/leaflet-search/dist/leaflet-search.src.css',
//	'src/css/materialadmin.css',
//	'src/css/tagsort.css',
//	'src/css/wire.css',
	'lib/line-awesome/css/line-awesome.css',
	'src/L-oscars.css'
	])
    .pipe(concatCss("L-oscars.css", {rebaseUrls: false}))
    .pipe(gulp.dest('./dist/'));
});

gulp.task('copy', function () {
     return gulp.src([
		'src/L-oscars-zone-group.js',
		'src/L-oscars-device-group.js',
	])
    .pipe(gulp.dest('./dist/'));
});

gulp.task('copyimg', function () {
     return gulp.src([
		'src/i/*'
	])
    .pipe(gulp.dest('./dist/i'));
});

gulp.task('copyfav', function () {
     return gulp.src([
		'src/i/favicons/*'
	])
    .pipe(gulp.dest('./dist/i/favicons'));
});

gulp.task('copyfonts', function () {
     return gulp.src([
		'lib/line-awesome/css/fonts/*'
	])
    .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('clean', function () {
	return gulp.src([
		'./dist'
	], {read: false})
	.pipe(clean());
});


gulp.task('default', gulp.series(/*clean,*/'concatjs','concatcss', 'copy', 'copyimg', 'copyfav', 'copyfonts'));