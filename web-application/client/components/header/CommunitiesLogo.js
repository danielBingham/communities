import React, { useState, useEffect} from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

import './CommunitiesLogo.css'

const CommunitiesLogo = function() {
    const [imageUrl, setImageUrl] = useState(null)

    useEffect(function() {
        const host = document.querySelector('meta[name="communities-host"]').content
        const url = `${host}/assets/icon-1024x1024.png`

        fetch(url).then(function(response) {
            return response.blob()
        }).then(function(imageBlob) {
            const imageObjectUrl = URL.createObjectURL(imageBlob)
            setImageUrl(imageObjectUrl)
        }).catch(function(error) {
            console.log(`Failed to retrieve CommunitiesLogo: ${url}`)
            console.error(error)
        })

    }, [])

    return (
        <>
            { imageUrl !== null && <div className="communities-logo"><Link to="/"><img src={imageUrl} /><span className="logo-text">ommunities</span></Link></div> }
        </>
    )

}

export default CommunitiesLogo
