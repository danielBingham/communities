import React from 'react'
import { Outlet } from 'react-router-dom'

import { useScrollRestoration } from '/lib/hooks/useScrollRestoration'

import Header from '/components/header/Header'
import Footer from '/components/header/Footer'

import './MainLayout.css'

const MainLayout = function() {
    
    useScrollRestoration()

    return (
        <>
        <Header />
        <main>
            <Outlet />
        </main>
        <Footer />
        </>
    )
}

export default MainLayout
