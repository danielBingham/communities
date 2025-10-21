/**
 * Validate an email.
 */
export const validateEmail = function(email, required) {
    const errors = []

    if ( required && ( email === null || email === undefined || email.length <= 0 )) {
        errors.push('Email is required!')
    } 

    if ( email.length > 512 ) {
        errors.push('Email is too long.  Limit is 512 characters.')
    } 

    if ( ! email.includes('@') ) {
        errors.push('Please enter a valid email.')
    } 

    return errors
}

/**
 * Validate a User's name.
 */
export const validateName = function(name, required) {
    const errors = []

    if ( required && ( name === null || name === undefined || name.length <= 0 )) {
        errors.push('Name is required!')
    } 

    if ( name.length > 512 ) {
        errors.push('Name is too long. Limit is 512 characters.')
    } 

    return errors
}

/**
 * Validate a User's username.
 */
export const validateUsername = function(username, required) {
    const errors = []

    if ( required && ( username === null || username === undefined || username.length == 0 )) {
        errors.push('Username is required!')
    } 

    if ( username.length > 512 ) {
        errors.push('Username is too long. Limit is 512 characters.')
    }         

    if ( username.match(/^[a-zA-Z][a-zA-Z0-9\-_]+$/) === null ) {
        errors.push(`Username must start with a letter and only contain letters, numbers, -, or _.`)
    }

    return errors
}

export const validatePassword = function(password, required) {
    const errors = []

    if ( required && ( password === null || password === undefined || password.length == 0 )) {
        errors.push('Password is required!')
    } 

    if ( password.length < 12 ) {
        errors.push('Your password is too short.  Please choose a password at least 12 characters in length.')
    } 

    if ( password.length > 256 ) {
        errors.push('Your password is too long. Limit is 256 characters.')
    } 

    return errors
}

export const validateAbout = function(about, required) {
    const errors = []

    if ( required && (about === null || about === undefined || about.length === 0 ) ) {
        errors.push('About is required.')
    }

    if ( about.length > 250 ) {
        errors.push('About is too long.  Limit is 250 characters.')
    }

    return errors
}
