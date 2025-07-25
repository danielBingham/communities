import React from 'react'
import { Outlet } from 'react-router-dom'

import { useScrollRestoration } from '/lib/hooks/useScrollRestoration'

import './HeaderlessLayout.css'

const HeaderlessLayout = function() {

    useScrollRestoration()

    return (
        <main className="headerless">
            <Outlet />
        </main>
    )
}

export default HeaderlessLayout
