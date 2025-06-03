const objectHas = function(object, property) {
    return property in object && object[property] !== undefined
}

module.exports = {
    objectHas: objectHas
}
