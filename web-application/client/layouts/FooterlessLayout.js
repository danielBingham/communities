import { Outlet } from 'react-router-dom'

import Header from '/components/header/Header'

import './FooterlessLayout.css'

const FooterlessLayout = function() {

    return (
        <>
        <Header />
        <main id="footerless">
            <Outlet />
        </main>
        </>
    )
}

export default FooterlessLayout
