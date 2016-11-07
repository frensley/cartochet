var gulp = require('gulp'),
    webpack = require('webpack-stream'),
    seq = require('run-sequence'),
    wp_config = require('./webpack.config.js'),
    merge = require('merge'),
    plugins = require('gulp-load-plugins')({
        rename: {
            'gulp-rimraf' : 'rm'
        }
    });

var paths = {
  src : ['client/css/**/*.css', 'client/*.html']
};

var build_output = "build_output";

gulp.task('bower install', function() {
    return plugins.bower({directory: 'bower_components'});
});

gulp.task('clean', function() {
    return gulp.src(build_output + '/*').pipe(plugins.rm());
});

gulp.task('bundle', function() {
   return gulp.src('client/app.js')
       .pipe(webpack(wp_config ))
       .pipe(gulp.dest(build_output));
});

gulp.task('copy src', function() {
    return gulp.src(paths.src, {base: 'client'})
        .pipe(gulp.dest(build_output))
        .pipe(plugins.livereload());
});

gulp.task('build', function(cb) {
   seq('clean', ['bower install', 'copy src'], 'bundle', cb);
});

gulp.task('watch', function() {
    return gulp.src('client/app.js')
        .pipe(webpack(merge( wp_config, { watch: true } )))
        .on('error', function handleError() {
            this.emit('end'); // Recover from errors
        })
        .pipe(gulp.dest(build_output));
});

gulp.task('default', ['build']);