import React from 'react'

import './Footer.css'

const Footer = function(props) {


    // ======= Render ===============================================
    return (
     <footer>
         <div className="wrapper">
            <div className="explanation-copyright">
                    <p className="explanation">Communities is a non-profit,
                cooperative social media platform built around communities of
                        interest and place. It is also built with the Paradox
                        of Tolerance in mind, and borrows from consensus
                decision making to help enable self moderation. </p>
                
                <p>Site text (c) <a href="https://github.com/danielbingham">Daniel Bingham</a> 2022 - 2023</p>
                <p>All user content (c) its authors.</p>
                <p>All content licensed under Creative Commons <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a></p>
            </div>
            <div className="about-links">
                <p><a href="/about">about</a></p>
                <p><a href="/tos">terms of service</a></p>
                <p><a href="/privacy">privacy policy</a></p>
            </div>
            <div className="content-links">
            </div>
            <div className="involve-links">
            </div>
         </div>
    </footer>
    )

}

export default Footer
