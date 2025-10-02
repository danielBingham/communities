import React from 'react'
import { createRoot } from 'react-dom/client'

import { Provider } from 'react-redux'

import { Capacitor } from '@capacitor/core'
import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { StatusBar, Style } from '@capacitor/status-bar'

import * as Sentry from "@sentry/react";

import logger from '/logger'

import App from './App'
import store from './state/store'

// We're on mobile.  Capacitor is handling updates.
if ( Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android' ) {
  CapacitorUpdater.notifyAppReady().then(function() {
    let host = document.querySelector('meta[name="communities-host"]').content
    let api = document.querySelector('meta[name="communities-api"]').content
    let environment = document.querySelector('meta[name="communities-environment"]').content
    let version = document.querySelector('meta[name="communities-version"]').content

    logger.info(`Communities startup with::\n 
      environment: "${environment}"\n
      host: "${host}"\n
      API: "${api}"\n
      Version: "${version}"\n
    `)

    if ( environment === 'production' ) {
      Sentry.init({
        dsn: "https://3738393d51a9e4de9b7fe4b2bbb0bf56@o4509038666055680.ingest.us.sentry.io/4509038670249984"
      });
    }

    StatusBar.setStyle({ style: Style.Light})

    document.body.classList.add(Capacitor.getPlatform())

    const container = document.getElementById('root')
    const root = createRoot(container)
    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    )
  })
} 
// We're on the web platform.  Capacitor isn't handling updates.
else {
  let host = document.querySelector('meta[name="communities-host"]').content
  let api = document.querySelector('meta[name="communities-api"]').content
  let environment = document.querySelector('meta[name="communities-environment"]').content
  let version = document.querySelector('meta[name="communities-version"]').content

  console.log(`Communities startup with::\n 
    environment: "${environment}"\n
    host: "${host}"\n
    API: "${api}"\n
    Version: "${version}"\n
  `)

  if ( environment === 'production' ) {
    Sentry.init({
      dsn: "https://3738393d51a9e4de9b7fe4b2bbb0bf56@o4509038666055680.ingest.us.sentry.io/4509038670249984"
    });
  }

  const container = document.getElementById('root')
  const root = createRoot(container)
  root.render(
      <Provider store={store}>
          <App />
      </Provider>
  )
}
