/**************************************************************************************************
 *          Configuration
 *
 * Our configuration file.  Depending on environment variables to get the
 * proper configuration set.
 *
 **************************************************************************************************/

if ( process.env.NODE_ENV == 'development' ) {
    require('dotenv').config()
}

const config = {
    host: process.env.HOST,
    wsHost: process.env.WS_HOST,
    environment: process.env.NODE_ENV,
    backend: '/api/0.0.0',
    // Database configuration
    database: {
        host: process.env.DATABASE_HOST,
        port: process.env.DATABASE_PORT,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: 'communities' 
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT 
    },
    session: {
        key: 'communities_id',
        secret: process.env.SESSION_SECRET,
        secure_cookie: false
    },
    s3: {
        bucket_url: process.env.S3_BUCKET_URL,
        bucket: process.env.S3_BUCKET,
        access_id: process.env.S3_ACCESS_ID,
        access_key: process.env.S3_ACCESS_KEY
    },
    postmark: {
        api_token: process.env.POSTMARK_API_TOKEN
    },
    stripe: {},
    log_level: process.env.LOG_LEVEL 
}

if ( process.env.NODE_ENV == 'production' ) {
    config.stripe = {
        portal: "https://billing.stripe.com/p/login/28o8xf0LV92h0uc8ww",
        links: {
            5: "https://donate.stripe.com/fZecQm48n09F7racMU",
            10: "https://donate.stripe.com/eVa7w234j1dJaDm3cl",
            15: "https://donate.stripe.com/aEUaIe20f09Fh1KdQW",
            20: "https://donate.stripe.com/bIY4jQ7kz2hNfXG28f",
            40: "https://donate.stripe.com/3csaIegV9aOj3aUeUV",
            50: "https://donate.stripe.com/aEUdUqbAPcWraDm5kp",
            60: "https://donate.stripe.com/00gbMi5crg8D3aUfYY",
            100: "https://donate.stripe.com/5kA4jQ9sH9KfeTC3cg",
            200: "https://donate.stripe.com/fZe9Ea9sH4pVbHq003",
            500: "https://donate.stripe.com/8wM17E6gv8GbaDm4gi"
        }
    }
} else {
    config.stripe = {
        portal: "https://billing.stripe.com/p/login/test_fZebJqdUAaMs5vWdQQ",
        links: {
            5: "https://donate.stripe.com/test_8wMaHN9Uo67H41i001",
            10: "https://donate.stripe.com/test_00g8zF9Uo1RrbtK288",
            15: "https://donate.stripe.com/test_14k0392rWeEd9lCeUX",
            20: "https://donate.stripe.com/test_7sIbLRgiM9jTapG3ce",
            40: "https://donate.stripe.com/test_4gw5ntfeIeEd1Ta5ks",
            50: "https://donate.stripe.com/test_cN27vB3w0cw5apG004",
            60: "https://donate.stripe.com/test_6oE17d8Qkbs11TadQZ",
            100: "https://donate.stripe.com/test_cN217d9Uo2VvcxOdQV",
            200: "https://donate.stripe.com/test_9AQ4jp2rW7bL8hycMS",
            500: "https://donate.stripe.com/test_cN2g27c2w7bL7du8wD"
        }
    }
}

module.exports = config
