const StringValidator = require('./StringValidator')

// Adapted from https://github.com/manishsaraan/email-validator/blob/master/index.js
//
// With thanks to:
// http://fightingforalostcause.net/misc/2006/compare-email-regex.php
// http://thedailywtf.com/Articles/Validating_Email_Addresses.aspx
// http://stackoverflow.com/questions/201323/what-is-the-best-regular-expression-for-validating-email-addresses/201378#201378
// https://en.wikipedia.org/wiki/Email_address  
//
// The format of an email address is local-part@domain, where the local part
// may be up to 64 octets long and the domain may have a maximum of 255
// octets.
const tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
const validateEmail = function (email) {
    if ( email === null || email === undefined || typeof email !== 'string' || email.length <= 0) {
        return false
    }

    const emailParts = email.split('@');

    if (emailParts.length !== 2) {
        return false
    }

    const account = emailParts[0]
    const address = emailParts[1]

    if (account.length > 64) {
        return false
    } else if (address.length > 255) {
        return false
    }

    const domainParts = address.split('.')

    if (domainParts.some((part) => part.length > 63)) {
        return false
    }

    return tester.test(email)
}

module.exports = class EmailValidator extends StringValidator {
    constructor(name, value, existing, action) {
        super(name, value, existing, action)
    }

    mustBeEmail() {
        if ( this.shortCircuit() || this.value === '') {
            return this
        }

        if ( ! validateEmail(this.value) ) {
            this.errors.push({
                type: `${this.name}:invalid`,
                log: `${this.name} must be valid email.  '${this.value}' is not valid.`,
                message: `Must be a valid email address.`
            })
        }

        return this
    }
}
