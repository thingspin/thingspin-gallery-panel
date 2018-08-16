import coreModule from 'grafana/app/core/core_module';
import * as mqtt from 'mqtt/dist/mqtt.min';

export class MqttSrv {
    private _host: string;
    set host(host: string) { this._host = host; }
    get host() { return this._host; }

    private _subscribe: string;
    set subscribe(subscribe: string) {
        if (this.client !== undefined ) {
            if (this._subscribe !== undefined ) {
                console.log("[MQTT] unsubscribe : ", this._subscribe);
                this.client.unsubscribe(this._subscribe);
            }
            console.log("[MQTT] subscribe : ", subscribe);
            this.client.subscribe(subscribe);
        }
        this._subscribe = subscribe;
    }
    get subscribe() { return this._subscribe; }

    private _connect: any;
    set client(client: any) { this._connect = client; }
    get client() { return this._connect;}


    constructor() {
    }

    connect(host: string) {
        this.host = host;
        try {
            if (this.client) {
                this.client.end();
            } else {
                this.client = mqtt.connect(host);
                this.client.on('connect', this.onConnect.bind(this));
                this.client.on('close', this.onClose.bind(this));
                this.client.on('end', this.onEnd.bind(this));
            }
        } catch (e) {
            console.error(e);
            this.client = undefined;
        }
    }

    onConnect() {
        console.log("[MQTT] Connected : " + this.host);
        if (this.subscribe &&  this.client) {
            this.client.subscribe(this.subscribe);
        }
    }

    onClose() {
        console.log("[MQTT] Disconnected : " + this.host);
        this.client = undefined;
    }
    onEnd() {
        console.log("[MQTT] Disconnected : " + this.host);
        this.client = mqtt.connect(this.host);
        this.client.on('connect', this.onConnect.bind(this));
        this.client.on('close', this.onClose.bind(this));
        this.client.on('end', this.onEnd.bind(this));
}

    recvMessage(callback: any) {
        if (!this.client) {
            this.client.on('message', callback.bind(this));
        }
    }

    publishMessage(topic: string, message: string, options: object) {
        if (this.client) {
            console.log('[MQTT publish]',topic, message, options);
            try {
                this.client.publish(topic, message, options);
            } catch (e) {
                console.error(e);
            }
        }
    }
}

coreModule.service('MqttSrv', MqttSrv);
