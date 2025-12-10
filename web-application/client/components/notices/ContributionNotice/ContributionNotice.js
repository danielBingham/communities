import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { useRequest } from '/lib/hooks/useRequest'

import { patchUser } from '/state/User'

import ContributionCard from '/components/contribution/ContributionCard'
import CommunitiesLogo from '/components/header/CommunitiesLogo'
import Button from '/components/ui/Button'

import './ContributionNotice.css'

const ContributionNotice = function({}) {
    const [showMore, setShowMore] = useState(false)
    const [ request, makeRequest] = useRequest()

    const currentUser = useSelector((state) => state.authentication.currentUser)

    const navigate = useNavigate()

    const setContribution = function(amount) {
        const notices = JSON.parse(JSON.stringify(currentUser.notices))

        notices.contribution = {
            amount: amount, 
            date: Date.now()
        }


        const userPatch = {
            id: currentUser.id,
            notices: notices
        }

        makeRequest(patchUser(userPatch))
    }

    useEffect(function() {
        if ( ! currentUser || currentUser?.notices?.contribution !== undefined ) {
            navigate("/")
        }
    }, [ currentUser ])


    if ( ! currentUser ) {
        console.error(new Error(`Attempt to show ContributionNotice with no logged in user.`))
        return null
    }

    return (
        <div className="contribution-notice">
            <div className="contribution-notice__logo"><CommunitiesLogo /></div>
            <article className="contribution-notice__explanation">
                <p>Developing, maintaining, and moderating this platform all cost money.</p>
                <p>We're not taking venture capital, not showing you ads, not
                    selling your data, and <strong>not paywalling the platform</strong>.</p>
                <p>We need users to contribute for this to work.</p>
                <p>Communities uses a "pay what you can" monthly subscription.</p>
                <p>We're asking you to contribute $10 / month, or whatever you can. <strong>You can use the platform without contributing.</strong>  But if you can contribute, please do!</p>
            </article>
            <div className="contribution-grid">
                <ContributionCard amount={5} onClick={() => setContribution(5)} explanation={"Cost of a cup of coffee."} />
                <ContributionCard amount={10} onClick={() => setContribution(10)} explanation={"Sustainable contribution."} />
                <ContributionCard amount={15} onClick={() => setContribution(15)} explanation={"Cost of streaming service."} />
            </div>
           
            <div className="additional-contributions">
                <a href="" onClick={(e) => { e.preventDefault(); setShowMore( ! showMore) }}>{ showMore ? 'Hide' : 'Show' } Supporter Levels</a>
            </div>
            <div className="contribution-grid" style={{ display: ( showMore ? 'grid' : 'none' ) }}>
                <ContributionCard amount={20} onClick={() => setContribution(20)} explanation={"Cover one other person's contribution."} />
                <ContributionCard amount={50} onClick={() => setContribution(50)} explanation={"Cover four other people's contributions."} />
                <ContributionCard amount={100} onClick={() => setContribution(100)} explanation={"Cover nine other people's contributions."} />
            </div>
            <div className="contribution-notice__skip">
                <Button href="https://donate.stripe.com/3cIfZ8cvIeDo8hwakogUM0a" external={true} onClick={() => setContribution(0)}>Make a One Time Contribution</Button>
                <Button onClick={() => setContribution(0)}>Skip for Now</Button>
            </div>
        </div>
    )
}

export default ContributionNotice
