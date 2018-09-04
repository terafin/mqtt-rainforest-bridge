
# Rainforest -> MQTT Bridge

## Required environment variables

| ENV VARIABLE        | EXAMPLE                                              |                 |
|---------------------| -----------------------------------------------------| --------------- |
| MQTT_HOST           | "mqtt://your-mqtt.server.here"                       | **REQUIRED**    |
| MQTT_USER           | "mqtt username"                                      | *OPTIONAL*      |
| MQTT_PASS           | "mqtt username"                                      | *OPTIONAL*      |
| TOPIC_PREFIX        | "/your/topic/prefix"                                 | **REQUIRED**    |
| RAINFOREST_IP       | YOUR.RAINFOREST.IP.OR.HOSTNAME                       | *OPTIONAL*      |
| RAINFOREST_USER     | "your rainforest username (on the device itself)"    | *OPTIONAL*      |
| RAINFOREST_PASS     | "your rainforest password"                           | *OPTIONAL*      |
| LISTENING_PORT      | "your rainforest username (on the device itself)"    | *OPTIONAL*      |
| LISTENING_PATH      | "your rainforest password"                           | *OPTIONAL*      |

## Example Usage for HTTP endpoint

Here's a full docker flow you can use to pull the latest image, delete the old one, and create a new container named 'mqtt-rainforest-bridge':

* `docker pull terafin/mqtt-rainforest-bridge:latest`
* `docker rm -f mqtt-rainforest-bridge`
* `docker run -d -e TOPIC_PREFIX='/energyusage/home' -e LISTENING_PORT='32000' -e LISTENING_PATH='/rainforest/data' -e MQTT_HOST='mqtt://mymqtt.local.address' --name='mqtt-rainforest-bridge' terafin/mqtt-rainforest-bridge:latest`
  
This will spin up a working rainforest HTTP PUT endpoint at port 32000, with path /rainforest/data, which will start sending the MQTT messages below

To look at the logging output, you can:

* `docker logs -f mqtt-rainforest-bridge`

## Example Usage for polling

Here's a full docker flow you can use to pull the latest image, delete the old one, and create a new container named 'mqtt-rainforest-bridge':

* `docker pull terafin/mqtt-rainforest-bridge:latest`
* `docker rm -f mqtt-rainforest-bridge`
* `docker run -d -e TOPIC_PREFIX='/energyusage/home' -e RAINFOREST_USER='0x1234' -e RAINFOREST_PASS='mysecretpassword!' -e RAINFOREST_IP='10.0.1.100' -e MQTT_HOST='mqtt://mymqtt.local.address' --name='mqtt-rainforest-bridge' terafin/mqtt-rainforest-bridge:latest`


This will spin up a working rainforest bridge to a device at IP 10.0.1.100, which will start sending the MQTT messages below

To look at the logging output, you can:

* `docker logs -f mqtt-rainforest-bridge`

## MQTT results

Here's some sample (from my system) results after using the above setup:

*Note: These will be polled and updated every 5 seconds.*

    /energyusage/home/demand 0
    /energyusage/home/meter_status Connected
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