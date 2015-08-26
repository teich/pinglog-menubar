
var SOMECONST = {
  id: 'foo'
}

var menubar       = require('menubar')
var child_process = require('child_process')
var request       = require('request')
var dialog        = require('dialog')
var Server        = require('electron-rpc/server')

var app = new Server()

// var opts = {dir: __dirname, icon: path.join(__dirname, 'images', 'Icon.png')}
var opts
var menu = menubar(opts)

var statsStore = []
var statsSize = 5

process.on('uncaughtException', function (err) {
  dialog.showErrorBox('Uncaught Exception: ' + err.message, err.stack || '')
  menu.app.quit()
})

menu.on('ready', function ready () {
  var canQuit = false

  menu.on('show', function show () {
    app.configure(menu.window.webContents)
    // app.send('update', JSON.stringify(statsStore))
    app.send('show', JSON.stringify(statsStore))
  })

  app.on('terminate',  function terminate (ev) {
    canQuit = true
    menu.app.terminate()
  })

  setInterval(function() {
    post_stats()
  }, 5000)
})

// Functions

function ping(host) {
  var ping_cmd = "ping -c 1 " + host + " | grep 'time=' | awk '{print $7}' | cut -f 2 -d '='"
  return child_process.execSync(ping_cmd).toString().trim();
}

function ping_gateway() {
    var gateway_cmd="netstat -rn | grep 'default' | awk '{print $2}'"
    var gateway_ip = child_process.execSync(gateway_cmd).toString().trim();
    return ping(gateway_ip);
}

function ping_google() {
    return ping("8.8.8.8");
}

function get_ssid() {
    var ssid_cmd="/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I | awk '/ SSID/ {print substr($0, index($0, $2))}'"
    return child_process.execSync(ssid_cmd).toString().trim();
}

function get_uuid() {
    var uuid_cmd="ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | cut -f 2 -d '='"
    var uuid = child_process.execSync(uuid_cmd).toString().trim();
    uuid = uuid.replace(/"/g, "");
    return uuid;

}

function save_stats(data) {
  statsStore.push(data)
  if (statsStore.length > statsSize) {
    statsStore.shift()
  }
}

function post_stats() {
  var formData = {
    log: {
      network: get_ssid(),
      gateway: ping_gateway(),
      google:  ping_google(),
      host:    get_uuid()
    }
  }
  save_stats(formData.log)

  request.post({
    url: 'https://enigmatic-ocean-6979.herokuapp.com/api/logs',
    method: 'POST',
    json: formData
  }, function (error, response, body) {
    if (error) {
      console.log(error)
    } else {
      // console.log (response.statusCode, formData.log.network);
    }
  })
}
