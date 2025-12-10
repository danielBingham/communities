import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import ContributionCard from '/components/contribution/ContributionCard'
import Button from '/components/ui/Button'

import './ContributionView.css'

const ContributionView = function() {
    const [showMore, setShowMore] = useState(false)

    const portalURI = useSelector((state) => state.system.configuration.stripe.portal)

    return (
        <div className="contribution-view">
            <div className="intro">
                <p>Developing, maintaining, and moderating this platform all cost money.</p>
                <p>We're not taking venture capital, not showing you ads, not
                    selling your data, and <strong>not paywalling the platform</strong>.</p>
                <p>We need users to contribute for this to work.</p>
                <p>Communities uses a "pay what you can" monthly subscription.</p>
                <p>We're asking you to contribute $10 / month, or whatever you can. <strong>You can use the platform without contributing.</strong>  But if you can contribute, please do!</p>
                <p><strong>Beta:</strong> If you've already set up a contribution, <a href={portalURI}>click here</a> to manage it. If you have any issues, please reach out to <a href="mailto:contact@communities.social">contact@communities.social</a>.</p>
            </div>
            <div className="contribution-grid">
                <ContributionCard amount={5} explanation={"Cost of a cup of coffee."} />
                <ContributionCard amount={10} explanation={"Sustainable contribution."} />
                <ContributionCard amount={15} explanation={"Cost of streaming service."} />
            </div>
           
            <div className="additional-contributions">
                <a href="" onClick={(e) => { e.preventDefault(); setShowMore( ! showMore) }}>{ showMore ? 'Hide' : 'Show' } Supporter Levels</a>
            </div>
            <div className="contribution-grid" style={{ display: ( showMore ? 'grid' : 'none' ) }}>
                <ContributionCard amount={20} explanation={"Cover one other person's contribution."} />
                <ContributionCard amount={50} explanation={"Cover four other people's contributions."} />
                <ContributionCard amount={100} explanation={"Cover nine other person's contribution."} />
            </div>
            <div className="contribution-view__one-time">
                <p>If you can't make a monthly commitment, but would still like to contribute, you can make a one time contribution here.</p>
                <div className="contribution-view__one-time__button">
                    <Button href="https://donate.stripe.com/3cIfZ8cvIeDo8hwakogUM0a" external={true}>Make a One Time Contribution</Button>
                </div>
            </div>
        </div>
    )
}

export default ContributionView
