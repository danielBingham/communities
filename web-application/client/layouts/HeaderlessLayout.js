import React from 'react'
import { Outlet } from 'react-router-dom'

const HeaderlessLayout = function() {

    return (
        <main>
            <Outlet />
        </main>
    )
}

export default HeaderlessLayout
