// Requirements
const mqtt = require('mqtt')

const logging = require('./homeautomation-js-lib/logging.js')
const rainforest = require('./homeautomation-js-lib/rainforest.js')
const health = require('./homeautomation-js-lib/health.js')

require('./homeautomation-js-lib/mqtt_helpers.js')


// Config
const rainforest_topic = process.env.RAINFOREST_TOPIC

// Setup MQTT
const client = mqtt.setupClient(null, null)

rainforest.on('energy-updated', (result) => {
    logging.log('Rainforest updated: ' + Object.keys(result))

    if (client.connected())
        health.healthyEvent()

    Object.keys(result).forEach(
        function(key) {
            if (key === 'demand_timestamp') return

            var value = result[key]

            if (key === 'demand')
                value = Number(value) * 1000

            logging.log(' ' + key + ':' + value)
            client.smartPublish(rainforest_topic + '/' + key, '' + value)
        }
    )
})