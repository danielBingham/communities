import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useScrollRestoration = function() {
    const location = useLocation()

    useEffect(() => {
        if ( ! ( 'hash' in location ) || location.hash === '' ) {
            window.scrollTo(0,0) 
        } else {
            const element = document.querySelector(location.hash)
            if ( element !== null && element !== undefined ) {
                element.scrollIntoView(true)
            }
        }
    }, [ location ])

    return null 
}
