import { createSlice } from '@reduxjs/toolkit'

const historySlice = createSlice({
    name: 'history',
    initialState: {
        stack: [],
        back: null 
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
        setBack: (state, action) => {
            state.back = action.payload
        },
        clearBack: (state, action) => {
            state.back = null
        }
    }
})


export const { push, pop, clear, setBack, clearBack } = historySlice.actions
export default historySlice.reducer
