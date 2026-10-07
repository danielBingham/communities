/******************************************************************************
 * Keeps the configuration definitions in step with each other.
 *
 * Every app has one committed definition per environment plus two development
 * examples. When a value is added to production, staging and both examples
 * need it too; these tests fail until they have it. Covers the web
 * application and the worker.
 ******************************************************************************/

const path = require('path')

const apps = {
    'web-application': path.join(__dirname, '../../../server/config'),
    'worker': path.join(__dirname, '../../../../worker/config')
}

// The example files don't end in .js, but `require` loads a file with an
// unknown extension as JavaScript.
const load = (directory, name) => require(path.join(directory, name))

// { 'database.host': 'aws-ssm-parameter:/database/host', ... }
const flatten = function(definition, prefix = '') {
    const out = {}
    for (const [key, value] of Object.entries(definition)) {
        const keyPath = prefix ? `${prefix}.${key}` : key
        if ( typeof value === 'object' && value !== null && ! Array.isArray(value) ) {
            Object.assign(out, flatten(value, keyPath))
        } else {
            out[keyPath] = value
        }
    }
    return out
}

const variableFor = (parameter) => 'COMMUNITIES_' + parameter.replace(/^\/+/, '').replace(/[/-]/g, '_').toUpperCase()

describe.each(Object.entries(apps))('Configuration definitions: %s', function(app, directory) {

    const production = flatten(load(directory, 'index.production.js'))
    const staging = flatten(load(directory, 'index.staging.js'))
    const ssmExample = flatten(load(directory, 'index.development.js-ssm-example'))
    const envExample = flatten(load(directory, 'index.development.js-env-example'))

    it('Should name its own environment in each file', function() {
        expect(production.environment).toBe('production')
        expect(staging.environment).toBe('staging')
        expect(ssmExample.environment).toBe('development')
        expect(envExample.environment).toBe('development')
    })

    it('Should only contain strings, so nothing is read from process.env directly', function() {
        for (const definition of [ production, staging, ssmExample, envExample ]) {
            for (const [key, value] of Object.entries(definition)) {
                expect([ key, typeof value ]).toEqual([ key, 'string' ])
            }
        }
    })

    it('Should define the same values, from the same sources, in staging and the Parameter Store example', function() {
        const withoutEnvironment = ({ environment, ...rest }) => rest
        expect(withoutEnvironment(staging)).toEqual(withoutEnvironment(production))
        expect(withoutEnvironment(ssmExample)).toEqual(withoutEnvironment(production))
    })

    it('Should read every Parameter Store value from its matching variable in the environment example', function() {
        expect(Object.keys(envExample).sort()).toEqual(Object.keys(production).sort())

        for (const [key, value] of Object.entries(production)) {
            if ( key === 'environment' ) {
                continue
            }
            const expected = value.startsWith('aws-ssm-parameter:')
                ? `env:${variableFor(value.substring('aws-ssm-parameter:'.length))}`
                : value
            expect([ key, envExample[key] ]).toEqual([ key, expected ])
        }
    })
})
