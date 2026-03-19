import { createSlice } from '@reduxjs/toolkit'

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
        clear: (state, action) => {
            state.stack = []
        },
        pushBackPoint: (state, action) => {
            const backPoint = action.payload
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


export const { push, pop, clear, pushBackPoint, popBackPoint} = historySlice.actions
export default historySlice.reducer
