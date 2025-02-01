import React from 'react'
import { Outlet } from 'react-router-dom'

import Header from '/components/header/Header'

import './MainLayout.css'

const MainLayout = function() {

    return (
        <>
        <Header />
        <main>
            <Outlet />
        </main>
        </>
    )
}

export default MainLayout
