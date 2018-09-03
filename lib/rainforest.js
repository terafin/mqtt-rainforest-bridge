const logging = require('homeautomation-js-lib/logging.js')
const request = require('request')
const repeat = require('repeat')
const EventEmitter = require('events')
const _ = require('lodash')

const rainforest_ip = process.env.RAINFOREST_IP
const rainforest_user = process.env.RAINFOREST_USER
const rainforest_pass = process.env.RAINFOREST_PASS

module.exports = new EventEmitter()

const send_request = function(callback) {
	var rainforest_url = 'http://' + rainforest_ip + '/cgi-bin/cgi_manager'
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

startMonitoring()
