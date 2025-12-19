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
    host: 'aws-ssm-parameter:/host', 
    wsHost: 'aws-ssm-parameter:/ws-host',
    environment: process.env.NODE_ENV,
    environmentName: process.env.ENVIRONMENT_NAME, 
    log_level: process.env.LOG_LEVEL,
    // Database configuration
    database: {
        host: 'aws-ssm-parameter:/database/host',
        port: 'aws-ssm-parameter:/database/port',
        user: 'aws-ssm-parameter:/database/user',
        password: 'aws-ssm-parameter:/database/password',
        name: 'aws-ssm-parameter:/database/name' 
    },
    redis: {
        host: 'aws-ssm-parameter:/redis/host',
        port: 'aws-ssm-parameter:/redis/port'
    },
    session: {
        cookieName: 'aws-ssm-parameter:/session/cookie-name',
        headerName: 'aws-ssm-parameter:/session/header-name',
        platformHeader: 'aws-ssm-parameter:/session/platform-header',
        secret: 'aws-ssm-parameter:/session/secret' 
    },
    s3: {
        bucket_url: 'aws-ssm-parameter:/storage/s3/bucket-url',
        bucket: 'aws-ssm-parameter:/storage/s3/bucket',
        access_id: 'aws-ssm-parameter:/storage/s3/access-id',
        access_key: 'aws-ssm-parameter:/storage/s3/access-key' 
    },
    postmark: {
        api_token: 'aws-ssm-parameter:/postmark/api-token' 
    },
    notifications: {
        ios: {
            privateCert: 'aws-ssm-parameter:/notifications/ios/apns-private-key-pem',
            publicCert: 'aws-ssm-parameter:/notifications/ios/apns-public-cert-pem', 
            applicationBundleID: 'aws-ssm-parameter:/notifications/ios/application-bundle-id',
            endpoint: 'aws-ssm-parameter:/notifications/ios/endpoint' 
        },
        android: {
            firebaseServiceAccount: 'aws-ssm-parameter:/notifications/android/firebase-service-account-json' 
        }
    },
    stripe: {
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
}
