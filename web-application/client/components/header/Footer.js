import { useSelector } from 'react-redux'

import GoogleBadge from '/assets/get-it-on-google-play.png'
import AppleBadge from '/assets/download-from-app-store.svg'

import './Footer.css'

const Footer = function() {
    const currentUser = useSelector((state) => state.authentication.currentUser)
    const clientVersion = useSelector((state) => state.system.clientVersion)
    const serverVersion = useSelector((state) => state.system.serverVersion)

    if ( currentUser === null || currentUser === undefined ) {
        return null
    }

    // ======= Render ===============================================
    
    return (
     <footer>
         <div className="footer__grid">
            <div className="footer_explanation footer__block">
                <p className="explanation">Communities is user-supported social media site working towards not for profit, cooperative governance. It is designed to help people build community, connect, and organize. It is funded and will be governed by its users.</p>
                <p className="explanation">Communities is <a href="https://github.com/danielbingham/communities">open source</a> under the <a href="https://github.com/danielBingham/communities?tab=AGPL-3.0-1-ov-file">AGPL 3.0 license</a> and it's currently in <a href="/about/faq#beta">Public Beta</a>.</p>
            </div>
            <div className="about-links footer__block">
                <p><a href="/about">about</a></p>
                <p><a href="/about/news">news</a></p>
                <p><a href="/about/faq">faq</a></p>
                <p><a href="/about/team">team</a></p>
                <p><a href="/about/roadmap">roadmap</a></p>
                <p><a href="/about/contribute">contribute</a></p>
                <p><a href="/about/tos">terms of service</a></p>
                <p><a href="/about/privacy">privacy policy</a></p>
                <p><a href="/about/operating-agreement">operating agreement</a></p>
                <p><a href="/about/contact">contact</a></p>
            </div>
            <div className="content-links footer__block">
                <p><a href="/">feeds</a></p>
                <p><a href="/friends">friends</a></p>
                <p><a href="/groups">groups</a></p>
            </div>
         </div>
         <div className="footer__bottom">
             <div className="footer__store-badges">
                 <a href="https://play.google.com/store/apps/details?id=social.communities" target="_blank" className="footer__google-store"><img src={GoogleBadge} /></a>
                 <a href="https://apps.apple.com/app/communities-social/id6751424847" target="_blank" className="footer__apple-store"><img src={AppleBadge} /></a>
             </div>
             <div>Version: { clientVersion === serverVersion ? `${clientVersion}` : `${clientVersion}/${serverVersion}` }</div>
             <div>Site text and design (c) Communities Social, LLC 2024 - 2025</div>
         </div>
    </footer>
    )

}

export default Footer
