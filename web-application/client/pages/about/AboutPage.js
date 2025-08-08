import React from 'react'
import { Outlet } from 'react-router-dom'

import { NavigationMenu, NavigationMenuLink, NavigationSubmenu, NavigationSubmenuLink } from '/components/ui/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import './AboutPage.css'

const AboutPage = function() {
    return (
        <Page id="about-page">
            <PageLeftGutter>
                <NavigationMenu className="about-page__menu">
                    <NavigationMenuLink to="/about" icon="InformationCircle" text="About" />
                    <NavigationMenuLink to="/about/faq" icon="QuestionMarkCircle" text="FAQ" />
                    <NavigationMenuLink to="/about/roadmap" icon="BookOpen" text="Roadmap" />
                    <NavigationMenuLink to="/about/contribute" icon="Heart" text="Contribute" />
                    <NavigationSubmenu id="AboutLegal" icon="ClipboardDocumentList" title="Legal">
                        <NavigationSubmenuLink to="/about/tos" icon="ClipboardDocumentCheck" text="Terms" />
                        <NavigationSubmenuLink to="/about/privacy" icon="ShieldCheck" text="Privacy" />
                    </NavigationSubmenu>
                    <NavigationMenuLink to="/about/contact" icon="Envelope" text="Contact" />
                </NavigationMenu>
            </PageLeftGutter>
            <PageBody className="content">
                <Outlet /> 
            </PageBody>
            <PageRightGutter>
            </PageRightGutter>
        </Page>
    )
}

export default AboutPage
