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
const rainforest_mac = process.env.RAINFOREST_MAC

const shouldSetupListener = !_.isNil(listening_port) && !_.isNil(listening_path)

module.exports = new EventEmitter()

const send_request = function(commandName, attributes, callback) {
	var rainforest_url = 'http://' + rainforest_ip + '/cgi-bin/cgi_manager'
	
	// NEED TO FIX MAC ID HERE

	var body_payload = '<Command><Name>' + commandName + '</Name><MacId>' + rainforest_mac + '</MacId>'
	
	if ( !_.isNil(attributes) ) {
		Object.keys(attributes).forEach(attribute => {
			body_payload += '<' + attribute + '>' + attributes[attribute] + '</' + attribute + '>'
		})
	}
	body_payload += '</Command>'

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

const send_poll_request = function(callback) {
	send_request('get_usage_data', null, callback)
}

const send_reboot_request = function(callback) {
	send_request('reboot', {Target: 'All'}, callback)
	send_request('get_schedule', {Event: 'price'}, callback)
}

const check_power = function() {
	logging.info('Checking power...')

	send_poll_request(function(error, body) {
		module.exports.emit('energy-updated', body)
	})
	send_reboot_request(function(error, body) {
		logging.info('reboot: ' + JSON.stringify(body) )
	})

}

const startMonitoring = function() {
	logging.info('Starting to monitor: ' + rainforest_ip)
	repeat(check_power).every(5, 's').start.in(1, 'sec')
}

if ( !shouldSetupListener || true ) {
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
		logging.info(' handleInstantaneousDemand: ' + JSON.stringify(body))

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

// <CurrentSummationDelivered>
//  <DeviceMacId>0xd8d5b9000000103f</DeviceMacId>
//  <MeterMacId>0x000781000086d0fe</MeterMacId>
//  <TimeStamp>0x1c531e54</TimeStamp>
//  <SummationDelivered>0x0000000001321a5f</SummationDelivered>
//  <SummationReceived>0x00000000003f8240</SummationReceived>
//  <Multiplier>0x00000001</Multiplier>
//  <Divisor>0x000003e8</Divisor>
//  <DigitsRight>0x01</DigitsRight>
//  <DigitsLeft>0x06</DigitsLeft>
//  <SuppressLeadingZero>Y</SuppressLeadingZero>
// </CurrentSummationDelivered>

const currentSummationDelivered = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.info(' currentSummationDelivered: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}


	})
}

// <TimeCluster>
//  <DeviceMacId>0xd8d5b9000000103f</DeviceMacId>
//  <MeterMacId>0x000781000086d0fe</MeterMacId>
//  <UTCTime>0x1c531da7</UTCTime>
//  <LocalTime>0x1c52ad27</LocalTime>
// </TimeCluster>

const timeCluster = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.info(' timeCluster: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}
	})
}

// <NetworkInfo>
// 	<DeviceMacId>0xd8d5b9000000103f</DeviceMacId>
// 	<CoordMacId>0x000781000086d0fe</CoordMacId>
// 	<Status>Connected</Status>
// 	<Description>Successfully Joined</Description>
// 	<ExtPanId>0x000781000086d0fe</ExtPanId>
// 	<Channel>20</Channel>
// 	<ShortAddr>0xe1aa</ShortAddr>
// 	<LinkStrength>0x64</LinkStrength>
// </NetworkInfo>

const networkInfo = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.info(' networkInfo: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}


	})
}

// <DeviceInfo>
//  <DeviceMacId>0xd8d5b9000000103f</DeviceMacId>
//  <InstallCode>0x8ba7f1dee6c4f5cc</InstallCode>
//  <LinkKey>0x2b26f9124113b1e2b317d402ed789a47</LinkKey>
//  <FWVersion>1.4.47 (6798)</FWVersion>
//  <HWVersion>1.2.3</HWVersion>
//  <ImageType>0x1301</ImageType>
//  <Manufacturer>Rainforest Automation, Inc.</Manufacturer>
//  <ModelId>Z109-EAGLE</ModelId>
//  <DateCode>2013103023220630</DateCode>
//  <Port>/dev/ttySP0</Port>
// </DeviceInfo>

const deviceInfo = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.debug(' deviceInfo: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}


	})
}

const messageCluster = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.debug(' messageCluster: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}


	})
}


const priceCluster = function(key, bodyArray) {
	bodyArray.forEach(body => {
		logging.debug(' priceCluster: ' + JSON.stringify(body))

		// const deviceMacId = body['DeviceMacId']
		const timeStamp = body['TimeStamp']
		
		if ( _.isNil(timeStamp) || timeStamp[0].length == 0 ) { 
			return 
		}


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
		case 'CurrentSummationDelivered':
			currentSummationDelivered(key, value)
			break
		case 'TimeCluster':
			timeCluster(key, value)
			break
		case 'NetworkInfo':
			networkInfo(key, value)
			break
		case 'MessageCluster':
			messageCluster(key, value)
			break
		case 'PriceCluster':
			priceCluster(key, value)
			break
		case 'DeviceInfo':
			deviceInfo(key, value)
			break
		default:
			logging.info(' => Unhandled event: ' + key)
			logging.debug('              body: ' + JSON.stringify(value))
		}
	})
}

// <PriceCluster>
//  <DeviceMacId>0xd8d5b9000000103f</DeviceMacId>
//  <MeterMacId>0x000781000086d0fe</MeterMacId>
//  <TimeStamp>0xffffffff</TimeStamp>
//  <Price>0x0000000e</Price>
//  <Currency>0x0348</Currency>
//  <TrailingDigits>0x02</TrailingDigits>
//  <Tier>0x01</Tier>
//  <StartTime>0xffffffff</StartTime>
//  <Duration>0xffff</Duration>
//  <RateLabel>Tier 1</RateLabel>
// </PriceCluster>

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

		const responseBody = '\
<Command>\n\
	<Name>set_schedule</Name>\n\
	<Event>price</Event>\n\
	<Frequency>0x0002</Frequency>\n\
	<Enabled>Y</Enabled>\n\
	<NetworkInterface>0xd8d5b90000009e89</NetworkInterface>\n\
</Command>\n\
'
		// <Command>
		// 	<Name>set_schedule</Name>
		// 	<Event>price</Event>
		// 	<Frequency>0xffff</Frequency>
		// <Enabled>Y</Enabled>
		// 	<NetworkInterface>0xFFFFFFFFFFFFFFFF</NetworkInterface>
		// </Command>
		
		res.send(responseBody)
	})

	app.listen(listening_port, function() {
		logging.info(' => started listening on port: ', listening_port)
	})

}
