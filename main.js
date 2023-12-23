const nodesjson = require("./nodes.json")

const mqtt = require('mqtt')
const util = require('util');

const client = mqtt.connect('mqtt://127.0.0.1:1883')

var originLatLon = [139.9555, 36.1124];

const personrecvstr = "+/person/recv/start2target/#"


client.on('connect', () => {
    client.subscribe("+/person/recv/start2target/#")
    client.subscribe("+/person/send/all/#")
    client.subscribe("aria/intra/persons/default")
    client.subscribe("+/test/#")
    client.subscribe("+/flood/count")
})

routes = []
agentStatus = []
influence = []

client.on('message', (topic, message) => {
    try {
        var mqttObj = JSON.parse(message.toString())
    } catch (err) {
        console.log(err)
    }

    // reflresh arrays when count = 0
    if (topic.startsWith('/flood')) {
        try {
            if (mqttObj["count"] == 0) {
                routes = []
                agentStatus = []
                influence = []
            }
        } catch (err) {
            console.log(err)
        }
    }

    // if test topic recv, send info in pub/sub message 
    if (topic.startsWith('/test')) {
        if (topic.startsWith('/test/get/evacroutes')) {
            console.log("evac route")
            buf = Buffer.from(JSON.stringify(routes), 'utf8');
            client.publish("/test/send/evacroutes", buf)

        } else if (topic.startsWith('/test/get/nearstatus')) {
            buf = Buffer.from(JSON.stringify(sta), 'utf8');
            client.publish("/test/send/nearstatus", buf)
        } else if (topic.startsWith('/test/get/evacroute')) {
            id = parseInt(topic.split("/")[4])
            retTopic = "/test/send/evacroute/" + String(id)

        }

        // if recv result from evac-sim, compute
    } else if (topic.startsWith('/person/recv')) {
        route = []
        for (let i in mqttObj) {
            let x = nodesjson[mqttObj[i]][0];
            let y = nodesjson[mqttObj[i]][1];
            route.push(pltToLatLon(-1.0 * y, x))

        }

        routes[parseInt(topic.split("/")[4])] = route

        // print past Route of Agents geolocation
        // console.log("routes:", routes)
    }
    if (topic.startsWith('aria/intra/persons/default')) {
        influence = []
        for (const prop in mqttObj) {
            influence[mqttObj[prop]['ID']] = mqttObj[prop]['influence']
        }
        console.log("influence:", influence)


    } else if (topic.startsWith('/person/send/all')) {
        for (const prop in mqttObj) {
            // dump current info about agents
            console.log(prop, mqttObj[prop])
            agentStatus[mqttObj[prop]['id']] = mqttObj[prop]['status']
        }
        console.log("status:", agentStatus)
    }
})

client.on('error', (err) => {
    console.error('Error:', err);
});

process.on('SIGINT', () => {
    console.log('Disconnecting from MQTT broker');
    client.end();
    process.exit();
});


function pltToLatLon(x, y) {
    // plane rectangular coordinate to lat lon
    // x, y -> 北緯・軽度
    // x =

    let phi0deg = originLatLon[1];
    let lambda0deg = originLatLon[0];
    // let x = -1.0 * this.routeXYArr[i][1];
    // let y = this.routeXYArr[i][0];

    // console.log(x,y)

    // variable
    var phi0rad = phi0deg * (Math.PI / 180);
    var lambda0rad = lambda0deg * (Math.PI / 180);

    let m0 = 0.9999;
    let a = 6378137.0;
    let F = 298.257222101;

    let n = 1 / (2 * F - 1);
    //   console.log(n);

    let A0 = 1 + Math.pow(n, 2) / 4 + Math.pow(n, 4) / 64;
    let A1 = (-3 / 2) * (n - Math.pow(n, 3) / 8 - Math.pow(n, 5) / 64);
    let A2 = (15 / 16) * (Math.pow(n, 2) - Math.pow(n, 4) / 4);
    let A3 = (-35 / 48) * (Math.pow(n, 3) - (5 / 16) * Math.pow(n, 5));
    let A4 = (315 / 512) * Math.pow(n, 4);
    let A5 = (-693 / 1280) * Math.pow(n, 5);
    //   console.log(A0, A1, A2, A3, A4, A5) ;

    let b1 =
        (1 / 2) * n -
        (2 / 3) * n ** 2 +
        (37 / 96) * n ** 3 -
        (1 / 360) * n ** 4 -
        (81 / 512) * n ** 5;
    let b2 =
        (1 / 48) * n ** 2 +
        (1 / 15) * n ** 3 -
        (437 / 1440) * n ** 4 +
        (46 / 105) * n ** 5;
    let b3 = (17 / 480) * n ** 3 - (37 / 840) * n ** 4 - (209 / 4480) * n ** 5;
    let b4 = (4397 / 161280) * n ** 4 - (11 / 504) * n ** 5;
    let b5 = (4583 / 161280) * n ** 5;
    //   console.log(b0, b1, b2, b3, b4, b5);

    let d1 =
        2 * n -
        (2 / 3) * n ** 2 -
        2 * n ** 3 +
        (116 / 45) * n ** 4 +
        (26 / 45) * n ** 5 -
        (2854 / 675) * n ** 6;
    let d2 =
        (7 / 3) * n ** 2 -
        (8 / 5) * n ** 3 -
        (227 / 45) * n ** 4 +
        (2704 / 315) * n ** 5 +
        (2323 / 945) * n ** 6;
    let d3 =
        (56 / 15) * n ** 3 -
        (136 / 35) * n ** 4 -
        (1262 / 105) * n ** 5 +
        (73814 / 2835) * n ** 6;
    let d4 =
        (4279 / 630) * n ** 4 - (332 / 35) * n ** 5 - (399572 / 14175) * n ** 6;
    let d5 = (4174 / 315) * n ** 5 - (144838 / 6237) * n ** 6;
    let d6 = (601676 / 22275) * n ** 6;
    //   console.log(d0, d1, d2, d3, d4, d5, d6);

    // 2
    let S_ =
        ((m0 * a) / (1 + n)) *
        (A0 * phi0rad +
            (A1 * Math.sin(2 * 1 * phi0rad) +
                A2 * Math.sin(2 * 2 * phi0rad) +
                A3 * Math.sin(2 * 3 * phi0rad) +
                A4 * Math.sin(2 * 4 * phi0rad) +
                A5 * Math.sin(2 * 5 * phi0rad)));
    let A_ = (m0 * a * A0) / (1 + n);
    //   console.log(S_, A_)

    // 3
    let xi = (x + S_) / A_;
    let eta = y / A_;
    //   console.log(xi, eta)

    // 4
    let xi2 =
        xi -
        (b1 * Math.sin(2 * 1 * xi) * Math.cosh(2 * 1 * eta) +
            b2 * Math.sin(2 * 2 * xi) * Math.cosh(2 * 2 * eta) +
            b3 * Math.sin(2 * 3 * xi) * Math.cosh(2 * 3 * eta) +
            b4 * Math.sin(2 * 4 * xi) * Math.cosh(2 * 4 * eta) +
            b5 * Math.sin(2 * 5 * xi) * Math.cosh(2 * 5 * eta));
    let eta2 =
        eta -
        (b1 * Math.cos(2 * 1 * xi) * Math.sinh(2 * 1 * eta) +
            b2 * Math.cos(2 * 2 * xi) * Math.sinh(2 * 2 * eta) +
            b3 * Math.cos(2 * 3 * xi) * Math.sinh(2 * 3 * eta) +
            b4 * Math.cos(2 * 4 * xi) * Math.sinh(2 * 4 * eta) +
            b5 * Math.cos(2 * 5 * xi) * Math.sinh(2 * 5 * eta));
    //   console.log(xi2, eta2)

    // 5
    let chi = Math.asin(Math.sin(xi2) / Math.cosh(eta2));
    //   console.log(chi)

    // 6
    let phi =
        chi +
        (d1 * Math.sin(2 * 1 * chi) +
            d2 * Math.sin(2 * 2 * chi) +
            d3 * Math.sin(2 * 3 * chi) +
            d4 * Math.sin(2 * 4 * chi) +
            d5 * Math.sin(2 * 5 * chi) +
            d6 * Math.sin(2 * 6 * chi));
    let lambda = lambda0rad + Math.atan(Math.sinh(eta2) / Math.cos(xi2));
    //   console.log(phi, lambda)

    var phideg = (1.0 / Math.PI) * 180 * phi;
    var lambdadeg = (1.0 / Math.PI) * 180 * lambda;
    var routeLatLon = [lambdadeg, phideg];
    // console.log(routeLatLon)

    // [140.0345848320657, 36.0586220553312]
    return routeLatLon;
}