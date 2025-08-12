import React from 'react'
import { Outlet } from 'react-router-dom'

import { useScrollRestoration } from '/lib/hooks/useScrollRestoration'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'

import { IosBuffer, AndroidBuffer } from '/components/ui/DeviceTweaks'

import './MainLayout.css'

const MainLayout = function() {
    
    useScrollRestoration()

    return (
        <>
        <Header />
        <IosBuffer />  
        <AndroidBuffer />
        <main>
            <Outlet />
        </main>
        <Footer />
        </>
    )
}

export default MainLayout
