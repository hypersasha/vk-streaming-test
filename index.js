const request = require('request');
const WebSocketClient = require('websocket').client;

const TOKEN = 'YOUR_SERVICE_APP_KEY'; // Get it on your VK App settings page

class VKStream {
    constructor( access_token ) {
        this.token = access_token;
        this.host = null;
        this.key = null;
        this.client = new WebSocketClient();
    }

    getEndpoint() {
        request.get('https://api.vk.com/method/streaming.getServerUrl?access_token=' + this.token, (err, res, body) => {
            let result = JSON.parse(body);
            this.host = result.response.endpoint; // Gets streaming server
            this.key = result.response.key; // Gets stream key
            this.getRules();
            this.connect();

            // Add some rules
            this.addRule('машина', 'car_tag');
            this.addRule('hyundai', 'hyundai_tag');
            this.addRule('bmw', 'bmw_tag');
        });
    }

    // Connect to WebSocket VK streaming server
    connect() {

        this.client.on('connectFailed', (err) => {
            console.log('Connect Failed: ' + err.toString());
        });

        this.client.on('connect', (connection) => {
            console.log('Connected to ' + this.host + ' via WebScoket!');

            // On connection error
            connection.on('error', (err) => {
                console.log("Connection Error: " + err.toString());
            });

            // On connection close
            connection.on('close', () => {
                console.log('Connection to host closed!');
            })

            // On new message from VK Streaming server
            connection.on('message', (message) => {
                if (message.type === 'utf8') {
                    let msg = JSON.parse(message.utf8Data);
                    console.log('Event: ' + msg.event.event_type + ', url: ' + msg.event.event_url + ', tags: ' + msg.event.tags.join(';'));
                }
            });
        });

        this.client.connect('wss://'+this.host+'/stream?key=' + this.key);
    }

    // Gets current Streaming rules
    getRules() {
        request.get('https://' + this.host + '/rules?key=' + this.key, (err, res, body) => {
            console.log('Current Rules:');
            console.log(body);
        });
    }

    // Adds a new rule to streaming
    addRule(rule_string, tag_string) {
        let options = {
            method: 'post',
            body: {rule: {value: rule_string, tag: tag_string}},
            json: true,
            url: 'https://' + this.host + '/rules?key=' + this.key
        };

        request(options, (err, res, body) => {
            if (err) {
                console.log(err);
            }
            console.log('Adding a new rule...');
            console.log(body);
        });
    }

    // Deletes a rule
    deleteRule(rule_tag) {
        let options = {
            method: 'delete',
            body: {tag: rule_tag},
            json: true,
            url: 'https://' + this.host + '/rules?key=' + this.key
        };

        request(options, (err, res, body) => {
            if (err) {
                console.log(err);
            }
            console.log('Removing a rule...');
            console.log(body);
        });
    }
}

let stream = new VKStream(TOKEN);
stream.getEndpoint();