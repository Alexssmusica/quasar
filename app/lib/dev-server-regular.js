const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')

const openBrowser = require('./helpers/open-browser')
const { log } = require('./helpers/logger')

let alreadyNotified = false

module.exports = class DevServer {
  constructor (quasarConfFile) {
    this.quasarConfFile = quasarConfFile
    this.server = null
  }

  async listen () {
    const cfg = this.quasarConfFile.quasarConf
    const webpackConf = this.quasarConfFile.webpackConf

    log(`Booting up...`)

    return new Promise(resolve => {
      const compiler = webpack(webpackConf.renderer || webpackConf)

      compiler.hooks.done.tap('done-compiling', compiler => {
        if (this.__started) { return }

        // start dev server if there are no errors
        if (compiler.compilation.errors && compiler.compilation.errors.length > 0) {
          return
        }

        this.__started = true

        this.server.listen(cfg.devServer.port, cfg.devServer.host, () => {
          log(`The devserver is ready to be used`)

          resolve()

          if (alreadyNotified === false) {
            alreadyNotified = true

            if (cfg.__devServer.open && ['spa', 'pwa'].includes(cfg.ctx.modeName)) {
              openBrowser({ url: cfg.build.APP_URL, opts: cfg.__devServer.openOptions })
            }
          }
        })
      })

      // start building & launch server
      this.server = new WebpackDevServer(compiler, cfg.devServer)
    })
  }

  stop () {
    if (this.server !== null) {
      log(`Shutting down`)

      return new Promise(resolve => {
        this.server.close(resolve)
        this.server = null
      })
    }
  }
}
