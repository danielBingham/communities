import React, { useState } from 'react'
import { useSelector } from 'react-redux'

import ContributionCard from '/components/contribution/ContributionCard'

import './Contribute.css'

const Contribute = function() {
    const [showMore, setShowMore] = useState(false)

    const portalURI = useSelector((state) => state.system.configuration.stripe.portal)

    return (
        <div className="contribute-view">
            <div className="intro">
                Communities is a <strong>non-profit social network</strong>.  We're not taking
                venture capital, not showing you ads, and not selling your
                    data.<br />  
                <p>We <strong>need user contributions</strong> for this to work.  
                Please contribute if you can!</p>
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
                <ContributionCard amount={40} explanation={"Cover three other people's contributions."} />
                <ContributionCard amount={60} explanation={"Cover five other people's contributions."} />
                <ContributionCard amount={100} explanation={"Cover nine other person's contribution."} />
                <ContributionCard amount={200} explanation={"Cover many people's contributions."} />
                <ContributionCard amount={500} explanation={"Wow!"} />
            </div>
        </div>
    )
}

export default Contribute
