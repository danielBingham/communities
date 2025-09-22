import React from 'react'
import { Outlet } from 'react-router-dom'

import { useScrollRestoration } from '/lib/hooks/useScrollRestoration'
import { useVersion } from '/lib/hooks/useVersion'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'

import './MainLayout.css'

const MainLayout = function() {
    
    useScrollRestoration()
    const [version, versionRequest] = useVersion()

    return (
        <>
        <Header />
        <main>
            <Outlet />
        </main>
        <Footer version={version} />
        </>
    )
}

export default MainLayout
