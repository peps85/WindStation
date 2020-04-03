// console.log = function(){}  //Uncomment for production
require('dotenv').config()
const express = require('express')
const mqtt = require('mqtt')

const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const cors = require('cors')
app.use(cors())

// MQTT broker connection options
var options = {
  port: 1883,
  //host: 'mqtt://127.0.0.1',
  clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  // username: '',
  // password: '',
  keepalive: 60,
  reconnectPeriod: 1000,
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clean: true,
  encoding: 'utf8'

  // keepalive: 0,
  // clientId: 'mqttjs_' + Math.random().toString(16).substr(2, 8),
  // reconnectPeriod: 5000,
  // connectTimeout: 20 * 1000,
  // username: "", //process.env.MQTT_USERNAME,
  // password: "", //process.env.MQTT_PASSWORD,
  // rejectUnauthorized: true, // False if broker uses self-signed certs
}
const host = 'mqtt://test.mosquitto.org' //process.env.MQTT_SERVER
var connectedClients = 0

var client = mqtt.connect(host, options)
client.on('error', function (err) {
  console.log(err)
  client.end()
})

io.on('connection', socket => {
  socket.on('disconnect', () => {
    connectedClients--
    console.log('Client left: ', connectedClients)
  })
  connectedClients++
  console.log('New client: ', connectedClients)
  console.log('hello from web page"')
  client.publish("provina", "hello from web page");
})


client.subscribe('app')
client.on('message', (topic, message) => {
  const verifyJSON = (json) => { // Catch invlaid JSON
    let parsed
    try {
      parsed = JSON.parse(json)
    } catch (err) {
      console.error('error', err)
    }
    return parsed
  }
  var received = verifyJSON(message)
  console.log('Topic: ' + topic + '\nMessage: ', JSON.stringify(received))
  io.emit('app', received) // Emit topic(city name) and json data to React
})

http.listen(8088, () => {
  console.log('Listening on port 8088')
})
