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

module.exports = {
    host: process.env.HOST,
    wsHost: process.env.WS_HOST,
    environment: process.env.NODE_ENV,
    log_level: process.env.LOG_LEVEL,
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
        cookieName: 'communities_id',
        headerName: 'X-Communities-Auth',
        platformHeader: 'X-Communities-Platform',
        secret: process.env.SESSION_SECRET
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
    notifications: {
        ios: {
            privateCert: process.env.NOTIFICATIONS_IOS_PRIVATE_CERT_PATH,
            publicCert: process.env.NOTIFICATIONS_IOS_PUBLIC_CERT_PATH,
            applicationBundleID: process.env.NOTIFICATIONS_IOS_APPLICATION_BUNDLE_ID,
            endpoint: process.env.NOTIFICATIONS_IOS_ENDPOINT
        },
        android: {
            firebaseServiceAccount: process.env.NOTIFICATIONS_FIREBASE_SERVICE_ACCOUNT_PATH 
        }
    },
};
