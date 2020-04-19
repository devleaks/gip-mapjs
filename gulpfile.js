var gulp = require('gulp');
var concat = require('gulp-concat');
var concatCss = require('gulp-concat-css');
var replace = require('gulp-replace');
var clean = require('gulp-clean');

gulp.task('concatjs', function() {
    return gulp.src([
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/leaflet/dist/leaflet.js',
            'node_modules/leaflet-realtime/dist/leaflet-realtime.js',
            'node_modules/beautifymarker/leaflet-beautify-marker-icon.js',
            'node_modules/leaflet-rotatedmarker/leaflet.rotatedMarker.js',
            'node_modules/leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.js',
            'node_modules/leaflet-sidebar-v2/js/leaflet-sidebar.js',
            'node_modules/leaflet-canvasicon/leaflet-canvasicon.js',
            'node_modules/leaflet-search/dist/leaflet-search.src.js',
            'node_modules/leaflet-betterscale/L.Control.BetterScale.js',
            'node_modules/leaflet-ant-path/dist/leaflet-ant-path.js',
            'node_modules/jsonpath-plus/dist/index-umd.js',
            'node_modules/mustache/mustache.js',
            'node_modules/moment/moment.js',
            'node_modules/@turf/turf/turf.min.js',
            'node_modules/@mapbox/geojsonhint/geojsonhint.js',
            'node_modules/renderjson/renderjson.js',
            'node_modules/peity/jquery.peity.js',
            'src/js/jquery.sieve.js',
            'src/js/tagsort.min.js',
            'src/js/sortElements.js',
            'src/js/jquery.growl.js',
            'src/js/parse_metar.js',
            'node_modules/beautifymarker/leaflet-beautify-marker-icon.js'
        ])
        .pipe(concat('L-oscars-libs.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('concatoscarsjs', function() {
    return gulp.src([
            'src/L-oscars-dashboard.js',
            'src/L-oscars-map.js',
            'src/L-oscars-wire.js',
            'src/L-oscars-util.js',
            'src/L-oscars-zone-group.js',
            'src/L-oscars-device-group.js'
        ])
        .pipe(concat('L-oscars.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('concatcss', function() {
    return gulp.src([
            //  'src/L-oscars-version.css',
            'node_modules/leaflet/dist/leaflet.css',
            'node_modules/leaflet-pulse-icon/src/L.Icon.Pulse.css',
            'node_modules/leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.css',
            'node_modules/beautifymarker/leaflet-beautify-marker-icon.css',
            'node_modules/leaflet-sidebar-v2/css/leaflet-sidebar.css',
            'node_modules/leaflet-betterscale/L.Control.BetterScale.css',
            'node_modules/leaflet-search/dist/leaflet-search.src.css',
            'src/css/materialadmin.css',
            'src/css/tagsort.css',
        ])
        .pipe(concatCss("L-oscars-libs.css", { rebaseUrls: false }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('rewritefonts', function() {
    return gulp.src([
            'node_modules/line-awesome/dist/font-awesome-line-awesome/css/all.css',
            'node_modules/line-awesome/dist/line-awesome/css/line-awesome.css'
        ])
        .pipe(replace(/\.\.\/(fonts|webfonts)/g, 'fonts'))
        .pipe(concatCss("line-awesome.css", { rebaseUrls: false }))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('copy', function() {
    return gulp.src([
            'src/L-oscars.css'
        ])
        .pipe(gulp.dest('./dist/'));
});

gulp.task('copyimg', function() {
    return gulp.src([
            'src/i/*'
        ])
        .pipe(gulp.dest('./dist/i'));
});

gulp.task('copyfav', function() {
    return gulp.src([
            'src/i/favicons/*'
        ])
        .pipe(gulp.dest('./dist/i/favicons'));
});

gulp.task('copyfonts', function() {
    return gulp.src([
            'src/fonts/*.woff',
            'node_modules/line-awesome/dist/line-awesome/fonts/*',
            'node_modules/line-awesome/dist/font-awesome-line-awesome/webfonts/*'
        ])
        .pipe(gulp.dest('./dist/fonts'));
});

gulp.task('clean', function() {
    return gulp.src([
            './dist'
        ], { read: false })
        .pipe(clean());
});


gulp.task('default', gulp.series( /*clean,*/ 'concatjs', 'concatoscarsjs', 'concatcss', 'rewritefonts', 'copy', 'copyimg', 'copyfav', 'copyfonts'));