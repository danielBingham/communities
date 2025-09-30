import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

export function useAuthentication() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const features = useSelector((state) => state.system.features)

    const navigate = useNavigate()
    useEffect(function() {
        if ( currentUser ) {
            if ( currentUser.status == 'invited' ) {
                navigate("/accept-invitation")
                return
            } else if ( currentUser.status == 'unconfirmed' ) {
                navigate("/email-confirmation")
                return
            } else if ( currentUser.status === 'confirmed' ) {
                const showTermsNotice = '3-notices' in features && ! currentUser.notices?.termsOfService
                if ( showTermsNotice ) {
                    navigate('/accept-terms-of-service')
                    return
                }

                const showContributionNotice = '3-notices' in features && ! currentUser.notices?.contribution
                if ( showContributionNotice ) {
                    navigate('/set-contribution')
                    return
                }

                // Have them set their birthdate.
                if ( currentUser.birthdate === '' ) {

                } else {
                    console.log(currentUser.birthdate)
                    const birthdate = new Date(currentUser.birthdate)
                    const now = new Date() 
                    console.log(`Birthdate: `, birthdate.toUTCString())
                    console.log(`Birthdate:\n
                        Year: ${birthdate.getUTCFullYear()}
                        Month: ${birthdate.getUTCMonth()}
                        Day: ${birthdate.getUTCDate()}`)
                        
                    console.log(`Now: `, now.toUTCString())
                    console.log(`Now:\n
                        Year: ${now.getUTCFullYear()}
                        Month: ${now.getUTCMonth()}
                        Day: ${now.getUTCDate()}`)

                    let age = now.getUTCFullYear() - birthdate.getUTCFullYear()
                    const month = now.getUTCMonth() - birthdate.getUTCMonth()
                    const day = now.getUTCDate() - birthdate.getUTCDate()
                    console.log(`Age: `, age)
                    console.log(`Month: `, month)
                    console.log(`Day: `, day)

                    if ( month < 0 || day < 0 ) {
                        age = age - 1
                    }

                    if ( age < 18 ) {
                        // Age gate them.
                        navigate('/age-gate')
                    }
                }
            }
        }
    }, [ currentUser ])

    return currentUser
}

