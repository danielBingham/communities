import React, { useRef } from 'react'
import { useSelector } from 'react-redux'

import Button from '/components/generic/button/Button'

import './ContributionCard.css'

const ContributionCard = function({ amount, explanation }) {

    const ref = useRef(null)

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const links = useSelector((state) => state.system.configuration.stripe.links)

    const contribution = `$${amount}`
    const encodedEmail = encodeURIComponent(currentUser.email)

    return (
        <div className="contribution">
            <div className="card">
                <h2>Contribute { contribution } / month</h2>
                <div className="explanation">{ explanation }</div>
                <a 
                    href={`${links[amount]}?prefilled_email=${encodedEmail}`} 
                    ref={ref} 
                    style={{ display: 'none' }}
                >Contribute { contribution } / month</a>
                <Button type="primary" onClick={(e) => ref.current.click() }>Contribute</Button>
            </div>
        </div>
    )
}

export default ContributionCard
