var gulp = require('gulp'),
    bower = require('gulp-bower'),
    refresh = require('gulp-livereload'),
    webpack = require('webpack-stream'),
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

gulp.task('bundle', ['build src'], function() {
   return gulp.src('client/app.js')
       .pipe(webpack(require('./webpack.config.js') ))
       .pipe(gulp.dest(build_output));
});

gulp.task('build src', function() {
    return gulp.src(paths.src, {base: 'client'})
        .pipe(gulp.dest(build_output))
        .pipe(refresh());
});

gulp.task('default', ['clean','bundle']);

gulp.task('watch', function() {
    refresh.listen();
    gulp.watch(paths.src, ['bundle']);
});