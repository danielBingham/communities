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

    logger.setStore(store)
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

  logger.setStore(store)
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

  const container = document.getElementById('root')
  const root = createRoot(container)
  root.render(
      <Provider store={store}>
          <App />
      </Provider>
  )
}
