import { Outlet } from 'react-router-dom'

import './HeaderlessLayout.css'

const HeaderlessLayout = function() {

    return (
        <main className="headerless">
            <Outlet />
        </main>
    )
}

export default HeaderlessLayout
