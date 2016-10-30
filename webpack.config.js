var webpack = require("webpack-stream/node_modules/webpack/lib/webpack");
var path = require('path');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

// this is for older nodejs
// https://github.com/webpack/css-loader/issues/145
require('es6-promise').polyfill()

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
                test: /\.css$/,
                loader: ExtractTextPlugin.extract("style-loader", "css-loader")
            },
            {
                test: /\.(gif|png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'url'
            }
        ]
    },
    plugins: [
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
        //requires that don't exist in the browser context
        new webpack.IgnorePlugin(/fs/)
    ]
};