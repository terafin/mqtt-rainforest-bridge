const logging = require('homeautomation-js-lib/logging.js')
const request = require('request')
const repeat = require('repeat')
const EventEmitter = require('events')
const _ = require('lodash')
const express = require('express')
const bodyParser = require('body-parser')

require('body-parser-xml')(bodyParser)

const listening_port = process.env.LISTENING_PORT
const listening_path = process.env.LISTENING_PATH

const rainforest_ip = process.env.RAINFOREST_IP
const rainforest_user = process.env.RAINFOREST_USER
const rainforest_pass = process.env.RAINFOREST_PASS

const shouldSetupListener = !_.isNil(listening_port) && !_.isNil(listening_path)

module.exports = new EventEmitter()

const send_request = function(callback) {
	var rainforest_url = 'http://' + rainforest_ip + '/cgi-bin/cgi_manager'
	
	// NEED TO FIX MAC ID HERE

	var body_payload = '<LocalCommand><Name>get_usage_data</Name><MacId>0xd8d5b90000009e89</MacId></LocalCommand>'
	const skipAuth = _.isNil(rainforest_user ) || _.isNil(rainforest_pass)
	
	logging.info('request url: ' + rainforest_url + ' using auth: ' + (skipAuth ? 'NO' : 'YES'))

	const postFunction = function(err, httpResponse, body) {
		if (!_.isNil(err)) {
			logging.error('error:' + err)
			logging.error('httpResponse:' + httpResponse)
			logging.error('body:' + body)
		}
		if (callback !== null && callback !== undefined) {
			return callback(err, body)
		}
	}
	const urlConfig = {url: rainforest_url, body: body_payload, json: true}
	
	if ( skipAuth ) {
		request.post(urlConfig, postFunction)
	} else {
		request.post(urlConfig, postFunction).auth(rainforest_user, rainforest_pass, true)
	}
}

const check_power = function() {
	logging.info('Checking power...')

	send_request(function(error, body) {
		module.exports.emit('energy-updated', body)
	})
}

const startMonitoring = function() {
	logging.info('Starting to monitor: ' + rainforest_ip)
	repeat(check_power).every(5, 's').start.in(1, 'sec')
}

if ( !shouldSetupListener ) {
	startMonitoring()
}


const toSigned4 = function(number) {
	if ( number > 0x7FFFFFFF ) {
		return number - 0xFFFFFFFF
	}

	return number
}

const handleZero = function(number) {
	if ( _.isNil(number) ) {
		return Number(0)
	}
	return number
}

const handleInstantaneousDemand = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.debug(' handleInstantaneousDemand: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}

		const demand = toSigned4(handleZero(Number(body['Demand'])))
		const multiplier = handleZero(Number(body['Multiplier']))
		const divisor = handleZero(Number(body['Divisor']))

		// const meterMacId = body['MeterMacId']
		// const digitsRight = body['DigitsRight']
		// const digitsLeft = body['DigitsLeft']
		// const suppressLeadingZero = body['SuppressLeadingZero']
		// const port = body['Port']
		const instantaneousDemand = handleZero(demand * multiplier / divisor)


		logging.debug('[handleInstantaneousDemand] instantaneousDemand: ' + instantaneousDemand + '  Demand: ' + demand + '  multiplier: ' + multiplier + '  divisor: ' + divisor)

		module.exports.emit('energy-updated', {demand: instantaneousDemand})

	})
}

const processBody = function(body) {
	const rainforest = body.rainforest

	const keys = Object.keys(rainforest)


	keys.forEach(key => {
		const value = rainforest[key]
		switch (key) {
		// Device update
		case '$':
			break
		case 'InstantaneousDemand':
			handleInstantaneousDemand(key, value)
			break

		default:
			logging.info(' => Unhandled event: ' + key)
			logging.debug('              body: ' + JSON.stringify(value))
		}
	})
}

if ( shouldSetupListener ) {
	logging.info('Setting up HTTP listener at http://localhost:' + listening_port + listening_path)
	const app = express()

	app.use(bodyParser.xml())

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Origin', '*')
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
		next()
	})


	app.post(listening_path, function(req, res) {
		processBody(req.body)

		res.send('OK')
	})

	app.listen(listening_port, function() {
		logging.info(' => started listening on port: ', listening_port)
	})

}
