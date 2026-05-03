import * as qs from 'qs'

import { makeRequest } from '/state/lib/makeRequest'
import { setRelationsInState } from '/state/lib/relations'

import {
    setMutualsInDictionary, setMutualsNull, removeMutuals
} from './slice'


export const getMutuals = function(params) {
    return function(dispatch, getState) {
        const endpoint = `/mutuals${( params ? '?' + qs.stringify(params) : '')}`
        return dispatch(makeRequest('GET', endpoint, null,
            function(response) {
                dispatch(setMutualsInDictionary({ dictionary: response.dictionary }))

                dispatch(setRelationsInState(response.relations))
            }
        ))
    }
}
