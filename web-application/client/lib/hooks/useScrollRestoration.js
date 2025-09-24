import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useScrollRestoration = function() {
    const location = useLocation()

    useEffect(() => {
        if ( ! ( 'hash' in location ) || location.hash === '' ) {
            window.scrollTo(0,0) 
        }
    }, [ location ])

    return null 
}
