const config = {
  appId: "social.communities",
  appName: "Communities",
  webDir: "web-application/public/dist/",
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    CapacitorUpdater: {
      autoUpdate: false,
      keepUrlPathAfterReload: true
    },
    CapacitorCookies: {
      enabled: true
    }
  }
}

// ============ Staging Environment Build =================
if ( process.env.NODE_ENV === 'staging' ) {
  config.ios = {
    scheme: 'App Staging'
  }
  config.android = {
    flavor: 'staging'
  }
} 
// ============ Production Environment Build ===============
else if ( process.env.NODE_ENV === 'production' ) {
  config.ios = {
    scheme: 'App'
  }
  config.android = {
    flavor: 'production'
  }
} 
// =========== Development / Local Environment Build ======
else {
  config.ios = {
    scheme: 'App Local'
  }
  config.android = {
    flavor: 'local'
  }

}

module.exports = config
