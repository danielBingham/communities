import { Outlet } from 'react-router-dom'

import './HeaderlessLayout.css'

const HeaderlessLayout = function() {

    return (
        <main id="headerless">
            <Outlet />
        </main>
    )
}

export default HeaderlessLayout
