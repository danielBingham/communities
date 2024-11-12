import React  from 'react'
import { useParams } from 'react-router-dom'

import FieldView from '/components/fields/FieldView'

import { DocumentCheckIcon, TagIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

import Spinner from '/components/Spinner'
import { Page, PageBody, PageHeader, PageTabBar, PageTab } from '/components/generic/Page'

import './FieldPage.css'

const FieldPage = function(props) {
    const { id, pageTab } = useParams()
    
    // ======= Render =====================================
    const selectedTab = ( pageTab ? pageTab : 'papers')

    let content = ( <Spinner local={true} /> )

    return (
        <Page id="field-page">
            <PageHeader>
                <FieldView id={ id } />
            </PageHeader>
            <PageBody>
                { content }
            </PageBody>
        </Page>
    )
}

export default FieldPage
