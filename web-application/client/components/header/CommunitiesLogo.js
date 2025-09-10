import { useState, useEffect} from 'react'

import logger from '/logger'

import './CommunitiesLogo.css'

const CommunitiesLogo = function() {
    const [imageUrl, setImageUrl] = useState(null)

    const host = document.querySelector('meta[name="communities-host"]').content
    const url = `/assets/icon-1024x1024.png`

    /*useEffect(function() {
        const host = document.querySelector('meta[name="communities-host"]').content
        const url = `${host}/assets/icon-1024x1024.png`

        logger.debug(`Loading Communities Logo: ${url}`)

        fetch(url).then(function(response) {
            logger.debug(`Got logo response: ${response.status}`)
            return response.blob()
        }).then(function(imageBlob) {
            logger.debug(`Got logo blob.`)
            const imageObjectUrl = URL.createObjectURL(imageBlob)
            setImageUrl(imageObjectUrl)
        }).catch(function(error) {
            console.log(`Failed to retrieve CommunitiesLogo: ${url}`)
            console.error(error)
        })

    }, [])*/

    return (
        <>
            {/* imageUrl !== null && <div className="communities-logo"><a href="/"><img src={imageUrl} /><span className="logo-text">ommunities</span></a></div> */}
            <div className="communities-logo"><a href="/"><img src={url} onError={(e) => console.error(e)} /><span className="logo-text">ommunities</span></a></div> 
        </>
    )

}

export default CommunitiesLogo
