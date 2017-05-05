const WebpackNotifierPlugin = require('webpack-notifier');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
    entry: {
        "vid-stats": "./src/app.js"
    },
    output: {
        path: path.join(__dirname, "./dist/"),
        filename: "[name].js"
    },
    devtool: 'source-map',
    devServer: {
        contentBase: "./dist",
        host: "localhost",
        port: 9000
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loader: "babel-loader",
                exclude: /node_modules/,
                query: {
                    presets: ['es2015', 'react']
                }
            },
            {
                test: /\.html$/,
                loader: "html-loader"
            },
            // allow importing CSS files
            { test: /\.s?css$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!sass-loader' }) },
            { test: /\.less$/, loader: ExtractTextPlugin.extract({ fallback: 'style-loader', use: 'css-loader!less-loader' }) },
            { test: /\.(woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
            { test: /\.(png)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader' }
        ]
    },
    // set alias to node_modules for easy require statements, eg:
    // require("leaflet-css");
    resolve: {
        extensions: ['.js', '.css', '.scss'],
        alias: {
            "leaflet-css": path.resolve(__dirname, 'node_modules/leaflet/dist/leaflet.css')
        }
    },
    plugins: [
        new ExtractTextPlugin('[name].css'),
        new HtmlWebpackPlugin({
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin([
            { from: 'src/data', to: 'data' }
        ]),
        new WebpackNotifierPlugin(),
        // set globals
        new webpack.ProvidePlugin({   
            jQuery: 'jquery',
            $: 'jquery',
            jquery: 'jquery'
        })
    ]
};
