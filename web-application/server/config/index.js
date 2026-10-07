/**************************************************************************************************
 *          Configuration
 *
 * Picks the configuration definition for NODE_ENV from this folder:
 * index.production.js, index.staging.js or index.development.js. Each one
 * declares where every value comes from (see index.production.js), and
 * `Config.loadConfig()` in @communities/backend loads them.
 *
 * index.development.js isn't committed. Create it by copying
 * index.development.js-env-example (values from environment variables) or
 * index.development.js-ssm-example (values from Parameter Store).
 **************************************************************************************************/

const { Config } = require('@communities/backend')

if ( process.env.NODE_ENV == 'development' ) {
    // Load `.env` from this app's folder, then from the repository root, which
    // is where documentation/running-locally.md puts it. Earlier files win, and
    // variables already set in the environment win over both. Only the values
    // the configuration file declares with `env:` are read from it.
    require('dotenv').config({
        path: [ '.env', require('path').join(__dirname, '..', '..', '..', '.env') ]
    })
}

module.exports = Config.definitionFor(__dirname, process.env.NODE_ENV)
