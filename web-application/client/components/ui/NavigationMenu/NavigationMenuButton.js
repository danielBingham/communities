import * as HeroIconsSolid from '@heroicons/react/24/solid'

import Button from '/components/ui/Button'

import NavigationMenuItem from './NavigationMenuItem'

import './NavigationMenuButton.css'

const NavigationMenuButton = function({ href, type, onClick, icon, text, className }) {

    const SolidIcon = HeroIconsSolid[`${icon}Icon`]

    return (
        <NavigationMenuItem>
            <Button href={href} className={`navigation-menu__button ${ className ? className : '' }`} type={type} onClick={onClick}>
                <SolidIcon /> <span className="nav-text">{ text }</span>
            </Button>
        </NavigationMenuItem>
    )
}

export default NavigationMenuButton
