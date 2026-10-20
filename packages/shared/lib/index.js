const mentions = require('./mentions')
const date = require('./date')
const news = require('./news')
const pageMetadata = require('./pageMetadata')
const preloadedEntities = require('./preloadedEntities')

module.exports = {
    mentions: mentions,
    date: date,
    news: news,
    pageMetadata: pageMetadata,
    preloadedEntities: preloadedEntities
}
