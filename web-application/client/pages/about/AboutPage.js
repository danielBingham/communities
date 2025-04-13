import React from 'react'
import { Outlet } from 'react-router-dom'

import { NavigationMenu, NavigationMenuItem } from '/components/generic/NavigationMenu'
import { Page, PageBody, PageLeftGutter, PageRightGutter } from '/components/generic/Page'
import './AboutPage.css'

const AboutPage = function() {
    return (
        <Page id="about-page">
            <PageLeftGutter>
                <NavigationMenu className="about-page__menu">
                    <NavigationMenuItem to="/about" icon="InformationCircle" text="About" />
                    <NavigationMenuItem to="/about/faq" icon="QuestionMarkCircle" text="FAQ" />
                    <NavigationMenuItem to="/about/roadmap" icon="BookOpen" text="Roadmap" />
                    <NavigationMenuItem to="/about/contribute" icon="Heart" text="Contribute" />
                    <NavigationMenuItem to="/about/tos" icon="ClipboardDocumentCheck" text="Terms" />
                    <NavigationMenuItem to="/about/privacy" icon="ShieldCheck" text="Privacy" />
                    <NavigationMenuItem to="/about/contact" icon="Megaphone" text="Contact" />
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
