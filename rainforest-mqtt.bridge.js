// Requirements
mqtt = require('mqtt')

logging = require('./homeautomation-js-lib/logging.js')
rainforest = require('./homeautomation-js-lib/rainforest.js')


// Config
host = process.env.MQTT_HOST
rainforest_ip = process.env.RAINFOREST_IP
rainforest_user = process.env.RAINFOREST_USER
rainforest_pass = process.env.RAINFOREST_PASSWORD
rainforest_topic = process.env.RAINFOREST_TOPIC

// Set up modules
logging.set_enabled(true)

// Setup MQTT
client = mqtt.connect(host)

// MQTT Observation

client.on('connect', () => {
    logging.log('Reconnecting...\n')
})

client.on('disconnect', () => {
    logging.log('Reconnecting...\n')
    client.connect(host)
})

function rainforest_update(result) {
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

rainforest.set_ip(rainforest_ip)
rainforest.set_user_pass(rainforest_user, rainforest_pass)

rainforest.set_callback(rainforest_update)