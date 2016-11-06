//some of the plugins require a higher nodejs than I have available
require("babel-register")({
    // Optional only regex - if any filenames **don't** match this regex then they
    // aren't compiled
    only: [/webpack-livereload-plugin/],

    // Setting this will remove the currently hooked extensions of .es6, `.es`, `.jsx`
    // and .js so you'll have to add them back if you want them to be used again.
    extensions: [".es6", ".es", ".jsx", ".js"]
});

var webpack = require('webpack');
var path = require('path');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LiveReloadPlugin = require('webpack-livereload-plugin');

// this is for older nodejs
// https://github.com/webpack/css-loader/issues/145
require('es6-promise').polyfill();

module.exports = {

    output: {
        filename: "app.bundle.js"
    },
    resolve: {
        root: [
            path.resolve('./client/js'),
            path.resolve('./bower_components')
        ]
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components|public)/,
                loader: "babel"
            },
            {
                test: /\.js?$/,
                exclude: /(node_modules|bower_components|public)/,
                loader: "babel"
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            {
                test: /\.(gif|png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url?limit=10000'
            }
        ]
    },
    plugins: [
        new LiveReloadPlugin(),
        //these are provided globally anytime the parser sees the key
        new webpack.ProvidePlugin({
            '$': 'jquery',
            'jQuery' : 'jquery',
            'window.jQuery' : 'jquery',
            'L' : 'leaflet',
            'corslite' : 'corslite',
            'jsonlint' : 'jsonlint'
        }),
        //extrace the css stream into this destination
        new ExtractTextPlugin("app.bundle.css"),
        //ignore requires that don't exist in the browser context
        new webpack.IgnorePlugin(/fs/)
    ]
};
