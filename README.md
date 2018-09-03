
# mqtt-rainforest-bridge

# Required environment variables

|         | ENV VARIABLE           | EXAMPLE  |
| ------------- |:-------------| -----:|
REQUIRED | MQTT_HOST | "mqtt://your-mqtt.server.here"
OPTIONAL | MQTT_USER | "mqtt username"
OPTIONAL | MQTT_PASS | "mqtt username"
REQUIRED | TOPIC_PREFIX | "/your/topic/prefix"
REQUIRED | RAINFOREST_IP | YOUR.RAINFOREST.IP.OR.HOSTNAME
REQUIRED | RAINFOREST_USER | "your rainforest username (on the device itself)"
REQUIRED | RAINFOREST_PASS | "your rainforest password"

# Example Usage

`docker run terafin/mqtt-rainforest-bridge -e TOPIC_PREFIX="/energyusage/home" -e RAINFOREST_IP="0x1234" -e RAINFOREST_PASS="mysecretpassword!" -e RAINFOREST_IP="10.0.1.100" -e MQTT_HOST="mqtt://mymqtt.local.address"`

This will spin up a working rainforest bridge to a device at IP 10.0.1.100, which will start sending the following MQTT messages:

# MQTT results

Here's some sample (from my system) results after using the above setup:

    /energyusage/home/meter_status Connected
    /energyusage/home/demand 0
    /energyusage/home/demand_units kW
    /energyusage/home/summation_received 4022.795
    /energyusage/home/summation_delivered 57155.849
    /energyusage/home/summation_units kWh
    /energyusage/home/price -1.0000
    /energyusage/home/price_units 840
    /energyusage/home/message_timestamp 946684800
    /energyusage/home/message_confirmed N
    /energyusage/home/message_confirm_required N
    /energyusage/home/message_id 0
    /energyusage/home/message_queue active
    /energyusage/home/message_read Y
    /energyusage/home/threshold_upper_demand 20.609000
    /energyusage/home/threshold_lower_demand -14.967000
    /energyusage/home/fast_poll_frequency 0x00
    /energyusage/home/fast_poll_endtime 0x00000000

These will be polled and updated every 5 seconds.