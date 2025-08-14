const {
    sentryWebpackPlugin
} = require("@sentry/webpack-plugin");

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const host = process.env.NODE_ENV === 'development' ? 'https://localhost:3000' : 'https://communities.social'

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
            }
        ]
    },
    devServer: {
        port: 3000,
        open: true,
        historyApiFallback: true,
        allowedHosts: [
            host
        ],
        server: {
            type: 'https',
            options: {
                key: './security/key.pem',
                cert: './security/cert.pem'
            }
        },
        proxy: [
            {
                context: ["/health", "/version", "/config", "/api/0.0.0"],
                target: "https://localhost:8080",
                changeOrigin: true,
                secure: false
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './server/views/index.html',
            meta: {
                "communities-host": host 
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
