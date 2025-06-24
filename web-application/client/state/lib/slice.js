/******************************************************************************
 * Universal methods for managing state.  These can be imported into a state
 * definition set as reducers on a redux slice.  They then provide the basic
 * state manipulation methods.
 ******************************************************************************/

import { queryIsUsing } from './queryIsUsing'

export const setInDictionary = function(state, action) {
    if ( 'dictionary' in action.payload) {
        state.dictionary = { ...state.dictionary, ...action.payload.dictionary }
    } else if( 'entity' in action.payload) {
        const entity = action.payload.entity
        state.dictionary[entity.id] = entity 
    } else {
        console.log(action)
        throw new Error(`Invalid payload sent to ${action.type}.`)
    }

    // Taint the queries so that they'll be requeried.
    for ( const [key,query] of Object.entries(state.queries)) {
        state.queries[key].taint = true
    }
}

export const removeEntity = function(state, action) {
    const entity = action.payload.entity
    const clearQueries = action.payload.clearQueries
    const ignoreQuery = action.payload.ignoreQuery

    // Don't remove an entity that is in use by a query unless that query is
    // currently being cleaned up OR unless we need to taint all the queries
    // and re-query because an entity has been deleted.
    if ( clearQueries !== true && queryIsUsing(state.queries, entity.id, ignoreQuery) ) {
        return
    }

    delete state.dictionary[entity.id]

    if (clearQueries === true ) {
        // Taint the queries so that they'll be requeried.
        for ( const [key,query] of Object.entries(state.queries)) {
            state.queries[key].taint = true
        }
    } 
}

export const makeQuery = function(state, action) {
    const name = action.payload.name

    state.queries[name] = {
        meta: {
            page: 1,
            count: 0,
            pageSize: 1,
            numberOfPages: 1
        },
        list: [] 
    }
}

export const setQueryResults = function(state, action) {
    const name = action.payload.name
    const meta = action.payload.meta
    const list = action.payload.list

    if ( ! state.queries[name] ) {
        state.queries[name] = {
            meta: meta,
            list: list
        }
    } else {
        state.queries[name].meta = meta
        state.queries[name].list = list 
    }
}

export const clearQuery = function(state, action) {
    const name = action.payload.name
    if ( name in state.queries ) {
        delete state.queries[name]
    }
}

export const clearQueries = function(state, action) {
    state.queries = {}
}
