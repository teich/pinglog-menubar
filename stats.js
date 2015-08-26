var Ractive = require('ractive')
var page = require('page')
var fs = require('fs')
var Client = require('electron-rpc/client')
var client = new Client()

Ractive.DEBUG = false

// Throw unhandled javascript errors
window.onerror = function errorHandler (message, url, lineNumber) {
  message = message + '\n' + url + ':' + lineNumber
  throwError(message)
}

var templates = {
  stats: fs.readFileSync(__dirname + '/stats.tmpl').toString()
}

var state = {}

var events = {
  quit: function () {
    client.request('terminate')
  }
}

var routes = {
  stats: function stats (ctx, next) {
    ctx.template = templates.stats
    state.stats = render(ctx, {loading: true})
  }
}

// set up routes
page('/', routes.stats)

// initialize router
page.start()
page('/')

// Load all statuses when the app gets focused
client.on('show', function (event, data) {
    var pings = JSON.parse(data)
    state.stats.set({data: pings})
})

function render (ctx) {
  var ract = new Ractive({
    el: '#container',
    template: ctx.template,
    data: ctx.data
  })

  ract.on(events)
  return ract
}

function catchErrors (callback) {
  return function throwErrorsOrContinue (err) {
    if (err) return throwError(err)
    callback()
  }
}

function throwError (error) {
  var message = error.stack || error.message || JSON.stringify(error)
  console.error(message)
  window.alert(message)
}
