const {
    sentryWebpackPlugin
} = require("@sentry/webpack-plugin");

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const package = require('./package.json')

let host = "https://communities.social"
if ( process.env.NODE_ENV === 'development') {
    host = 'https://localhost:3000' 
} else if ( process.env.NODE_ENV === 'staging' ) {
    host = 'https://staging.communities.social'
}

let api = '/api/0.0.0'

const outputDirectory = 'public/dist';

module.exports = {
    entry: './client/index.js',
    output: {
        path: path.resolve(__dirname, outputDirectory),
        filename: '[name].[hash].bundle.js',
        publicPath: '/',
        clean: true
    },
    resolve: {
        roots: [__dirname+'/client/']
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [
                    /node_modules/,
                    /packages/
                ],
                use: {
                    loader: 'babel-loader'
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.png|\.svg$/,
                type: 'asset/resource'
            }
        ]
    },
    devServer: {
        port: 3000,
        open: true,
        historyApiFallback: true,
        allowedHosts: [ host ],
        server: {
            type: 'https',
            options: {
                key: './security/key.pem',
                cert: './security/cert.pem'
            }
        },
        proxy: [
            {
                context: ["/health", api],
                target: "https://localhost:8080",
                changeOrigin: true,
                secure: false
            },
            {
                context: [ "/socket" ],
                target: "https://localhost:8080",
                secure: false,
                changeOrigin: true,
                ws: true
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './server/views/index.html',
            meta: {
                "communities-host": host,
                "communities-api": api,
                "communities-environment": process.env.NODE_ENV,
                "communities-version": package.version
            }
        }), 
        sentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: "communities",
            project: "frontend"
        })
    ],
    devtool: "source-map"
};
