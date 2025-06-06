import React from 'react'
import { createRoot } from 'react-dom/client'

import { Provider } from 'react-redux'

import * as Sentry from "@sentry/react";

import App from './App'
import store from './state/store'

Sentry.init({
  dsn: "https://3738393d51a9e4de9b7fe4b2bbb0bf56@o4509038666055680.ingest.us.sentry.io/4509038670249984"
});

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
    <Provider store={store}>
        <App />
    </Provider>
)
