const { chooseAWSCredentials } = require('../lib/aws-credentials')
const ConfigError = require('../errors/ConfigError')
const Config = require('../config')

describe('chooseAWSCredentials()', function() {
    const podIdentity = {
        AWS_CONTAINER_CREDENTIALS_FULL_URI: 'http://169.254.170.23/v1/credentials',
        AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE: '/var/run/secrets/pods.eks.amazonaws.com/serviceaccount/eks-pod-identity-token'
    }
    const keys = { AWS_ACCESS_KEY_ID: 'AKIALOCAL', AWS_SECRET_ACCESS_KEY: 'local-secret' }

    it('Should use the environment\'s keys when both are set', function() {
        expect(chooseAWSCredentials(keys, 'use S3')).toEqual({
            source: 'the access keys in AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY',
            credentials: { accessKeyId: 'AKIALOCAL', secretAccessKey: 'local-secret' }
        })
    })

    it('Should leave Pod Identity to the SDK when the pod has it and there are no keys', function() {
        expect(chooseAWSCredentials(podIdentity, 'use S3')).toEqual({ source: 'EKS Pod Identity', credentials: undefined })
        expect(chooseAWSCredentials({ ...podIdentity, AWS_ACCESS_KEY_ID: '', AWS_SECRET_ACCESS_KEY: '' }, 'use S3').source)
            .toBe('EKS Pod Identity')
    })

    it('Should prefer the keys when a pod has both', function() {
        expect(chooseAWSCredentials({ ...podIdentity, ...keys }, 'use S3').credentials)
            .toEqual({ accessKeyId: 'AKIALOCAL', secretAccessKey: 'local-secret' })
    })

    it('Should refuse only one of the keys, saying what for', function() {
        expect(() => chooseAWSCredentials({ AWS_ACCESS_KEY_ID: 'AKIALOCAL' }, 'use S3')).toThrow(ConfigError)
        expect(() => chooseAWSCredentials({ ...podIdentity, AWS_SECRET_ACCESS_KEY: 's' }, 'use S3'))
            .toThrow(/Only one of AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY is set. Set both to use S3 with access keys/)
    })

    it('Should never fall back on a profile, a login or the instance\'s role', function() {
        for (const env of [
            {},
            { AWS_PROFILE: 'developer' },
            { AWS_WEB_IDENTITY_TOKEN_FILE: '/token', AWS_ROLE_ARN: 'arn:aws:iam::123456789012:role/example' },
            { AWS_CONTAINER_CREDENTIALS_FULL_URI: podIdentity.AWS_CONTAINER_CREDENTIALS_FULL_URI },
            { AWS_CONTAINER_CREDENTIALS_RELATIVE_URI: '/v2/credentials/example' }
        ]) {
            expect(() => chooseAWSCredentials(env, 'use S3')).toThrow(/There are no AWS credentials to use S3 with/)
        }
    })

    it('Should be what Config reads Parameter Store with', function() {
        expect(Config.ConfigError).toBe(ConfigError)
        for (const env of [ keys, podIdentity ]) {
            expect(Config.awsCredentials(env)).toEqual(chooseAWSCredentials(env, 'read Parameter Store'))
        }
        expect(() => Config.awsCredentials({})).toThrow(/There are no AWS credentials to read Parameter Store with/)
    })
})
