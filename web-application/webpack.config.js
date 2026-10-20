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

let wsHost = "wss://communities.social"
if ( process.env.NODE_ENV === 'development') {
    wsHost = 'wss://localhost:3000'
} else if ( process.env.NODE_ENV === 'staging' ) {
    wsHost = 'wss://staging.communities.social'
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
                test: /\.png|\.svg|\.jpg$/,
                type: 'asset/resource'
            }
        ]
    },
    devServer: {
        port: 3000,
        open: true,
        historyApiFallback: true,
        devMiddleware: {
            // The Express server renders the pages from the index.html we
            // build (see the page proxy below), so it has to be on disk.
            writeToDisk: true,
            // Let requests for '/' through to the page proxy, rather than
            // answering them with index.html from memory.
            index: false
        },
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
            },
            {
                // Pages.  The Express server sends index.html with the page's
                // metadata rendered into it (see server/pages.js), so send
                // page requests there, as they are in staging and production,
                // rather than answering them with the bare index.html.
                //
                // A page request is one historyApiFallback would answer: a
                // GET or HEAD that accepts HTML, for a path without a file
                // extension.  Bundles and other files webpack built never
                // get here: the dev middleware answers them first.
                context: function(pathname, request) {
                    const accept = request.headers.accept ?? ''
                    return ( request.method === 'GET' || request.method === 'HEAD' )
                        && ( accept.includes('text/html') || accept.includes('*/*') )
                        && ! pathname.startsWith(api) && ! pathname.startsWith('/socket') && pathname !== '/health'
                        && ! /\.[^/]*$/.test(pathname)
                },
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
                "communities-host": host,
                "communities-api": api,
                "communities-environment": process.env.NODE_ENV,
                "communities-version": package.version,
                "Content-Security-Policy": {
                    "http-equiv": "Content-Security-Policy",
                    content: `
                      default-src 'self';
                      script-src 'self';
                      script-src-attr 'none';
                      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                      font-src 'self' https://fonts.gstatic.com data:;
                      img-src 'self' data: blob: https:;
                      media-src 'self' blob: https:;
                      connect-src 'self' ${host} ${wsHost} https://*.ingest.us.sentry.io https://*.sentry.io;
                      frame-src https://www.youtube.com;
                      object-src 'none';
                      base-uri 'self';
                      form-action 'self';
                      frame-ancestors 'none';
                    `
                }
            }
        }),
        sentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: "communities",
            project: "frontend",
            telemetry: false

        })
    ],
    devtool: "source-map"
};
