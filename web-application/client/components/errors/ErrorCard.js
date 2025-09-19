import { useNavigate } from 'react-router-dom'

import Button from '/components/generic/button/Button'

import './ErrorCard.css'

const ErrorCard = function({ children, href} ) {
    const navigate = useNavigate()
    const onClickInternal = function() {
        if ( href ) {
            navigate(href)
        }
    }

    return (
        <div className="error-card">
            <div className="error-card__wrapper">
                { children }
            </div>
            <div className="error-card__button">
                <Button type="warn" onClick={onClickInternal}>Continue</Button>
            </div>
        </div>
    )
}

export default ErrorCard
