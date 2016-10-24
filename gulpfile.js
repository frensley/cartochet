var gulp = require('gulp'),
    mainBowerFiles = require('gulp-main-bower-files'),
    bower = require('gulp-bower'),
    refresh = require('gulp-livereload'),
    rm = require('gulp-rimraf');


var paths = {
  src : ['client/css/**/*.css', 'client/js/**/*.js', 'client/*.html']
};

var build_output = "build_output";

gulp.task('bower install', function() {
    return bower({directory: 'bower_components'});
});

gulp.task('clean', function() {
    return gulp.src(build_output + '/*').pipe(rm());
});

gulp.task('extract bower', ['bower install'], function() {
    return gulp.src('./bower.json')
        .pipe(mainBowerFiles({
            base: 'bower_components',
            main: ['*.js', '*.css', 'dist/*.js', 'dist/*.css'],
            overrides: {
                'leaflet' : {
                    main: [
                        'dist/images/**/*.*',
                        'dist/leaflet-src.js',
                        'dist/leaflet.css'
                    ]
                },
                'corslite' : {
                    main: [
                        'corslite.js'
                    ]
                },
                'bootstrap': {
                    main: [
                        'dist/js/bootstrap.js',
                        'dist/css/*.min.*',
                        'dist/fonts/*.*'
                    ]
                },
                'Leaflet.UTFGrid' : {
                    main: [
                        'L.UTFGrid.js'
                    ]
                },
                'Leaflet.zoomdisplay' : {
                    main: [
                        'dist/leaflet.zoomdisplay-src.js',
                        'dist/leaflet.zoomdisplay.css'
                    ]
                },
                'jsonlint' : {
                    main: [
                        'lib/jsonlint.js'
                    ]
                },
                'codemirror' : {
                    main: [
                        'lib/codemirror.{js,css}',
                        'addon/**/*.{js,css}',
                        'mode/**/*.{js,css}'
                    ]
                },
                'x-editable' : {
                    main: [
                        'dist/bootstrap3-editable/**/*editable.{js,css}',
                        'dist/bootstrap3-editable/img/**/*.*'
                    ]
                },
                'font-awesome' : {
                    main: [
                        'css/*awesome.css',
                        'fonts/*.*'
                    ]
                },
                'sidebar-v2' : {
                    main: [
                        '{css,js}/leaflet-sidebar.{css,js}'
                    ]
                }
            }
        }))
        .pipe(gulp.dest(build_output + '/libs'));
});

gulp.task('build src', ['extract bower'], function() {
    return gulp.src(paths.src, {base: 'client'})
        .pipe(gulp.dest(build_output))
        .pipe(refresh());
});

gulp.task('default', ['clean','build src']);

gulp.task('watch', function() {
    refresh.listen();
    gulp.watch(paths.src, ['build src']);
})