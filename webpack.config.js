var path = require('path')
var webpack = require('webpack')

module.exports = {
    entry: ['babel-polyfill', path.join(__dirname, path.sep, "jsx", path.sep, "index.js")],
    output: {
        path: path.join(__dirname, path.sep, "js"),
        filename: 'index.js'
    },
    module: {
        loaders: [
            {test: /\.js$/, 
                loader: "babel-loader",
                exclude: /(node_modules|bower_components)/,
                query: { presets: ['es2015', 'stage-0', 'react'] }
            },
            {test: /\.css$/, loader: "style!css"},
            {test: /\.(jpgpng)$/, loader: "url?limit=8192"},
            {test: /\.scss$/, loader: "style!css!sass"}
        ]
    },
    plugins: [
        new webpack.BannerPlugin('This file is created by uforgetmenot'),
    ],

    target: 'electron-renderer'
}