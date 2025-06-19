const parseMentions = function(text) {
    const usernames = []

    // Add front and rear spaces to catch any mentions at the beginning or end
    // of the string.
    const matches = text.matchAll(/@([a-zA-Z0-9\.\-_]+)/g)

    for(const match of matches) {
        usernames.push(match[1])
    }

    return usernames
}

const tokenizeMentions = function(text) {
    return text.split(/(@[a-zA-Z0-9\.\-_]+)/)
}

module.exports = {
    parseMentions: parseMentions,
    tokenizeMentions: tokenizeMentions
}
