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
import { useSelector } from 'react-redux'

import Button from '/components/ui/Button'

import './ContributionCard.css'

const ContributionCard = function({ amount, explanation, onClick }) {

    const currentUser = useSelector((state) => state.authentication.currentUser)
    const links = useSelector((state) => state.system.configuration.stripe.links)

    const contribution = `$${amount}`

    let postFix = ''
    if ( currentUser ) {
        const encodedEmail = encodeURIComponent(currentUser.email)
        postFix = `?prefilled_email=${encodedEmail}`
    }

    return (
        <div className="contribution">
            <div className="card">
                <h2>Contribute { contribution } / month</h2>
                <div className="explanation">{ explanation }</div>
                <Button type="primary" href={`${links[amount]}${postFix}`} external={true} onClick={onClick}>Contribute</Button>
            </div>
        </div>
    )
}

export default ContributionCard
