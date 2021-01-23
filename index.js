const PORT = 33333;
const HOST = '104.248.77.64';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PACKET_TYPE_CONNECTION = 0;
const PACKET_TYPE_REQUEST_SPAWN = 1;
const PACKET_TYPE_DISCONNECT = 2;

var clients = {};
const spawnLocations = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10
];

var remainingSpawnLocations = shuffle(spawnLocations);

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', function() {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.on('message', function(message, remote) {
    const packetType = message.readUInt16LE(0);
    console.log(`client sent ${packetType} from ${remote.address}:${remote.port}`);
    switch (packetType) {
        case PACKET_TYPE_CONNECTION:
            addToClients(remote.address, remote.port);
            sendClientConnectionAcknowledgement(remote.address, remote.port);
            break;
        case PACKET_TYPE_REQUEST_SPAWN:
            sendClientSpawnLocation(remote.address, remote.port);
            break;
        case PACKET_TYPE_DISCONNECT:
            removeFromClients(remote.address);
            break;
        default:
            break
    }

    
});

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

function addToClients(address, port) {
    if (!Object.keys(clients).includes(address)) {
        clients[address] = port;
    }
}

function removeFromClients(address) {
    delete clients[address];
}

function sendClientConnectionAcknowledgement(address, port) {
    var buffer = Buffer.alloc(2, PACKET_TYPE_CONNECTION);
    server.send(buffer, 0, buffer.length, port, address, function(error, bytes) {
        if (error) {
            console.log(`server error sending connection acknowledgement to ${address}:${port}`);
        }
        console.log(`server sent connection acknowledgement to ${address}:${port}`);
    });
}

function sendClientSpawnLocation(address, port) {
    const spawnLocation = spawnLocations.pop();
    const buffer = Buffer.alloc(4);
    buffer.writeUInt16BE(PACKET_TYPE_REQUEST_SPAWN);
    buffer.writeUInt16BE(spawnLocation, 2);
    server.send(buffer, 0, buffer.length, port, address, function(error, bytes) {
        if (error) {
            console.log(`server error sending spawn location of ${spawnLocation} to ${address}:${port}`);
        }
        console.log(`server sent spawn location of ${spawnLocation} to ${address}:${port}`);
    });
}

// function repeatToClients(buffer) {
//     clients.forEach(function(item, index, array) {
//         server.send(buffer, 0, buffer.length, item.port, item.host, function(error, bytes) {
//             if (error) {
//                 console.log(`server error with sending to ${item.host}:${item.port}`);
//             }
//             console.log(`server sent to client ${item.host}:${item.port}`);
//         });
//     });
//     console.log(`server sent to all clients`);
// }

server.bind(PORT, HOST);