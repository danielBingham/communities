import React from 'react'

import { Page, PageBody } from '/components/generic/Page'

import RegistrationForm from '/components/authentication/RegistrationForm'

import './RegistrationPage.css'

const RegistrationPage = function(props) {


    const currentUser = useSelector(function(state) {
        return state.authentication.currentUser
    })
   
    const navigate = useNavigate()
    useEffect(function() {
        if ( ! currentUser ) {
            navigate('/')
        }
    }, [])

    if ( ! currentUser ) {
        return <Spinner />
    }

    return (
        <Page id="registration-page">
            <PageBody>
                <RegistrationForm />
            </PageBody>
        </Page>
    )
}

export default RegistrationPage
