import { createSlice } from '@reduxjs/toolkit'
import {
    setInDictionary,
    setNull,
    removeEntity
} from '/state/lib/slice'

const initialState = {
    /**
     * A dictionary of userRelationships we've retrieved from the backend, keyed by
     * user.id.
     *
     * @type {object}
     */
    dictionary: {},

}
        

export const MutualsSlice = createSlice({
    name: 'Mutuals',
    initialState: initialState,
    reducers: {
        setMutualsInDictionary: setInDictionary,
        setMutualsNull: setNull,
        removeMutuals: removeEntity,
        resetMutualsSlice: function() { 
            return initialState
        },
    }
})

export const { 
    setMutualsInDictionary, setMutualsNull, removeMutuals, 
    resetMutualsSlice,
}  = MutualsSlice.actions

export default MutualsSlice.reducer
