import React, { useState } from 'react'

import Button from '/components/generic/button/Button'
import Modal from '/components/generic/modal/Modal'

import { BlocklistForm } from '/components/admin/Blocklist'

const AddDomainButton = function() {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <Button type="primary" onClick={() => setShowModal(true)} >Add Domain</Button>
            <Modal isVisible={showModal} className="add-blocklist-modal">
                <BlocklistForm onComplete={() => setShowModal(false)} onCancel={() => setShowModal(false)}/>
            </Modal>
        </>
    )
}

export default AddDomainButton 
