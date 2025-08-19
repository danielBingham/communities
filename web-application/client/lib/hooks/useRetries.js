import { useRef, useState, useEffect } from 'react'

export const useRetries = function(name, makeRequest, request, maxRetries) {
    const [delay, setDelay] = useState(125)
    const [attempt, setAttempt] = useState(0)

    // Negative retries is infinite
    const maxRetriesInternal = maxRetries ? maxRetries : -1 

    const timeoutId = useRef(null)

    useEffect(function() {
        if ( request?.state !== 'pending' && request?.state !== 'fulfilled' && timeoutId.current === null) {
            if ( maxRetriesInternal > 0 && attempt >= maxRetriesInternal ) {
                // We've made too many attempts.  We've failed.
                console.error(`${name} failed.  Reached max retries.`)
                return
            }

            if ( attempt > 0 ) {
                console.log(`${name} failed.  Retrying in ${delay} ms...`)
            }

            timeoutId.current = setTimeout(function() {
                makeRequest()
                timeoutId.current = null
            }, delay) 
            setDelay(Math.floor(delay * 1.5))
            setAttempt(attempt + 1)
        }

        return function() {
            if ( timeoutId.current !== null ) {
                clearTimeout(timeoutId.current)
            }
        }
    }, [ request ])

}
