
/******************************************************************************
 *
 *  Communities -- Non-profit, cooperative social media 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { useState, useContext } from 'react'
import { useSelector } from 'react-redux'
import { Clipboard } from '@capacitor/clipboard'
import { LinkIcon } from '@heroicons/react/24/solid'

import logger from '/logger'

import Alert from '/components/ui/Alert'
import { DotsMenuItem, CloseMenuContext } from '/components/ui/DotsMenu'

import './CopyLink.css'

const STATUS = {
    PENDING: 'pending',
    SUCCESS: 'success',
    ERROR: 'error'
}

const CopyLink = function({ link }) {
    const [status, setStatus] = useState(STATUS.PENDING)

    const host = useSelector((state) => state.system.host)
    const closeMenu = useContext(CloseMenuContext)

    const executeCopy = async function() {
        try { 
            const url = new URL(link, host)
            
            await Clipboard.write({
                string: url.href
            })

            setStatus(STATUS.SUCCESS)
            closeMenu()
        } catch (error) {
            logger.error(`Failed to write link to clipboard: `, error)
            setStatus(STATUS.ERROR)
        }
    }

    if ( link === undefined || link === null || link === '' ) {
        return null
    }

    return (
        <>
            { status === STATUS.SUCCESS ? <Alert type="success" timeout={2000} onClear={() => setStatus(STATUS.PENDING)}>Link copied.</Alert> : null }
            { status === STATUS.ERROR ? <Alert type="error" timeout={2000} onClear={() => setStatus(STATUS.PENDING)}>Failed to copy link.</Alert> : null }
            <DotsMenuItem onClick={(e) => executeCopy()} className="copy-link"><LinkIcon /> Copy Link</DotsMenuItem>
        </>
    )
}

export default CopyLink
