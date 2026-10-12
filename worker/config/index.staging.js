/**************************************************************************************************
 *          Configuration: staging
 *
 * Loaded when NODE_ENV=staging (see index.js).
 *
 * Every string value declares where it comes from:
 *
 *   'aws-ssm-parameter:/path'  AWS Parameter Store, at /$COMMUNITIES_ENVIRONMENT_NAME/path
 *   'env:VARIABLE'             the environment variable VARIABLE
 *   anything else              used as written
 *
 * Nothing is read from the environment unless this file says `env:` for it.
 **************************************************************************************************/

module.exports = {
    host: 'aws-ssm-parameter:/host', 
    wsHost: 'aws-ssm-parameter:/ws-host',
    environment: 'staging',
    environmentName: 'env:COMMUNITIES_ENVIRONMENT_NAME',
    log_level: 'env:COMMUNITIES_LOG_LEVEL',
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
    // Storage: `driver` selects where uploaded files are kept, and the block
    // with the same name configures that driver (see
    // packages/backend/services/storage).
    storage: {
        driver: 's3',
        s3: {
            bucket_url: 'aws-ssm-parameter:/storage/s3/bucket-url',
            bucket: 'aws-ssm-parameter:/storage/s3/bucket',
            access_id: 'aws-ssm-parameter:/storage/s3/access-id',
            access_key: 'aws-ssm-parameter:/storage/s3/access-key'
        }
    },
    // Email: `driver` selects how email is sent, and the block with the same
    // name configures that driver (see packages/backend/services/email).
    email: {
        driver: 'postmark',
        postmark: {
            api_token: 'aws-ssm-parameter:/postmark/api-token'
        }
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
    }
}
