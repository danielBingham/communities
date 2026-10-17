const mentions = require('./mentions')
const date = require('./date')
const news = require('./news')
const markdown = require('./markdown')
const pageMetadata = require('./pageMetadata')
const preloadedResponses = require('./preloadedResponses')

module.exports = {
    mentions: mentions,
    date: date,
    news: news,
    markdown: markdown,
    pageMetadata: pageMetadata,
    preloadedResponses: preloadedResponses
}
