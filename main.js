var menubar       = require('menubar');
var child_process = require('child_process');
var request       = require('request');

var mb = menubar()


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

function post_stats() {
  var formData = {
    log: {
      network: get_ssid(),
      gateway: ping_gateway(),
      google:  ping_google(),
      host:    get_uuid()
    }
  }

  request.post({
    url: 'https://enigmatic-ocean-6979.herokuapp.com/api/logs',
    method: 'POST',
    // headers: {
    //   'Content-Type': 'application/json'
    // },
    json: formData
  }, function (error, response, body) {
    if (error) {
      console.log(error)
    // } else {
    //   console.log (response.statusCode, body);
    }
  })
}

mb.on('ready', function ready () {
  setInterval(function() {
    post_stats();
  }, 60000);
})
