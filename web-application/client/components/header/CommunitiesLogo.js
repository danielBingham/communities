import React from 'react'
import { Link } from 'react-router-dom'

import './CommunitiesLogo.css'

const CommunitiesLogo = function() {
    return (
        <div className="communities-logo"><Link to="/"><img src="/favicon-32x32.png" /><span className="logo-text">ommunities</span></Link></div>
    )
}

export default CommunitiesLogo
