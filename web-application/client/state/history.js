import { createSlice, current } from '@reduxjs/toolkit'

const historySlice = createSlice({
    name: 'history',
    initialState: {
        stack: [],
        backPoints: [] 
    },
    reducers: {
        push: (state, action) => {
            // Only keep the last 100 locations, we're unlikely to need to go
            // back further than that. If we don't do this, we could slowly
            // leak memory on mobile devices.
            if ( state.stack.length > 100 ) {
                state.stack.shift()
            }

            state.stack.push(action.payload)
        },
        pop: (state, action) => {
            state.stack.pop()
        },
        popToLocation: (state, action) => {
            const location = action.payload
            const index = state.stack.findLastIndex((l) => l.key === location.key)
            if ( index !== -1 ) {
                let current = state.stack.pop()
                while( current.key !== location.key ) {
                    current = state.stack.pop()
                }
            }
        },
        clear: (state, action) => {
            state.stack = []
        },
        pushBackPoint: (state, action) => {
            if ( state.backPoints.length > 100) {
                state.backPoints.shift()
            }
            state.backPoints.push(action.payload)
        },
        popBackPoint: (state, action) => {
            state.backPoints.pop() 
        },
        clearBackPoints: (state, action) => {
            state.backPoints = []
        }
    }
})

export const goToLastBackPoint = function() {
    return function(dispatch, getState) {
        const state = getState()

        const stack = state.history.stack
        const backPoints = state.history.backPoints

        if ( stack.length === 0 ) {
            return null
        } 

        if ( backPoints.length === 0 ) {
            return null
        }

        const backPoint = backPoints[backPoints.length-1] 
        const location = backPoint.location
        dispatch(historySlice.actions.popToLocation(location))
        dispatch(historySlice.actions.popBackPoint())

        return location
    }
}


export const { push, pop, clear, pushBackPoint, popBackPoint} = historySlice.actions
export default historySlice.reducer
