import React from 'react'
import { Outlet } from 'react-router-dom'

import Header from '/components/header/Header'

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
