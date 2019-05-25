// Requirements
const mqtt = require('mqtt')
const _ = require('lodash')

const logging = require('homeautomation-js-lib/logging.js')
const rainforest = require('./lib/rainforest.js')
const health = require('homeautomation-js-lib/health.js')
const mqtt_helpers = require('homeautomation-js-lib/mqtt_helpers.js')


// Config
const rainforest_topic = process.env.TOPIC_PREFIX

if (_.isNil(rainforest_topic)) {
	logging.warn('TOPIC_PREFIX not set, aborting')
	process.abort()
}

// Setup MQTT
const client = mqtt_helpers.setupClient(null, null)

rainforest.on('energy-updated', (result) => {
	const resultKeys = _.isNil(result) ? null : Object.keys(result)
	logging.info('Rainforest updated: ' + resultKeys)

	if ( _.isNil(resultKeys) ) {
		health.unhealthyEvent()
		return
	}

	if (client.connected) {
		health.healthyEvent()
	}

	resultKeys.forEach(
		function(key) {
			if (key === 'demand_timestamp') { 
				return 
			}

			var value = result[key]

			if (key === 'demand') {
				value = Number(value) * 1000 
			}

			logging.debug(' ' + key + ':' + value)
			client.smartPublish(rainforest_topic + '/' + key, '' + value)
		}
	)
})
