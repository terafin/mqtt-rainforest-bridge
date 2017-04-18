// Requirements
mqtt = require('mqtt')

logging = require('./homeautomation-js-lib/logging.js')
rainforest = require('./homeautomation-js-lib/rainforest.js')
mqtt_helpers = require('./homeautomation-js-lib/mqtt_helpers.js')


// Config
host = process.env.MQTT_HOST
rainforest_ip = process.env.RAINFOREST_IP
rainforest_user = process.env.RAINFOREST_USER
rainforest_pass = process.env.RAINFOREST_PASSWORD
rainforest_topic = process.env.RAINFOREST_TOPIC

// Set up modules
logging.set_enabled(false)

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
    logging.log("Rainforest updated: " + Object.keys(result))

    Object.keys(result).forEach(
        function(key) {
            value = result[key]
            if (key === 'demand')
                value = Number(value) * 1000

            logging.log(" " + key + ":" + value)
            mqtt_helpers.publish(client, rainforest_topic + "/" + key, "" + value)
        }
    )
}

rainforest.set_ip(rainforest_ip)
rainforest.set_user_pass(rainforest_user, rainforest_pass)

rainforest.set_callback(rainforest_update)