import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export function useAuthentication() {
    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()
    useEffect(function() {
        if ( currentUser && currentUser.status == 'invited' ) {
            navigate("/accept-invitation")
        } else if (currentUser && currentUser.status == 'unconfirmed' ) {
            navigate("/confirm-email")
        }
    }, [ currentUser ])

    return currentUser
}

