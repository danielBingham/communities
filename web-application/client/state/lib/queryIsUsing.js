export const queryIsUsing = function(queries, id, ignore) {
    for(const [key, query] of Object.entries(queries)) {
        if ( ignore === key ) {
            continue
        }

        if ( query.list.includes(id) ) {
            return true
        }
    }
    return false
}
