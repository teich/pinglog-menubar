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
  processAction: function (e) {
    var action = e.node.attributes['data-action'].value
    var procNameAttr = e.node.attributes['data-name']
    var data = {task: action}
    if (procNameAttr) data.name = procNameAttr.value
    client.request('task', data, function (err, data) {
      if (err) return throwError(err)
      if (!data) return

      if (Array.isArray(data)) {
        renderAll(data)
      } else if (data.name) {
        state.detail.set(data)
      }
    })
  },

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
// client.on('show', function () {
//   getAndRenderAll()
//   var currentProcess = state.detail && state.detail.get('name')
//   if (currentProcess) getAndRender(currentProcess)
// })

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
