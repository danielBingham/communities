
const contextHas = function(context, field) {
    return field in context && context[field] !== undefined && context[field] !== null
}

module.exports = {
    contextHas: contextHas
}
