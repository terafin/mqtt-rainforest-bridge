// Requirements
mqtt = require('mqtt')
url = require('url')

logging = require('./lib/logging.js')
airscape = require('./lib/airscape.js')


// Config
set_string = "/set"
host = process.env.MQTT_HOST
airscape_ip = process.env.AIRSCAPE_IP
airscape_topic = process.env.AIRSCAPE_TOPIC

// Set up modules
logging.set_enabled(false)

// Setup MQTT
client = mqtt.connect(host)

// MQTT Observation

client.on('connect', () => {
    logging.log('Reconnecting...\n')
    client.subscribe(airscape_topic + set_string)
})

client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    client.connect(host)
})

client.on('message', (topic, message) => {
    airscape.set_speed(parseInt(message))
})

function airscape_fan_update(result) {
    speed = result.fanspd
    logging.log("Airscape updated")
    logging.log(" speed:" + result.fanspd)
    logging.log(" doorinprocess:" + result.doorinprocess)
    logging.log(" timeremaining:" + result.timeremaining)
    logging.log(" cfm:" + result.cfm)
    logging.log(" power:" + result.power)
    logging.log(" house_temp:" + result.house_temp)
    logging.log(" attic_temp:" + result.attic_temp)
    logging.log(" oa_temp:" + result.oa_temp)

    client.publish(airscape_topic, "" + result.fanspd)
}

airscape.set_ip(airscape_ip)
airscape.set_callback(airscape_fan_update)