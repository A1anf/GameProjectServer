const PORT = 33333;
const HOST = '104.248.77.64';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

const PacketType = {
    PACKET_TYPE_CONNECTION: 0,
    PACKET_TYPE_REQUEST_SPAWN: 1,
    PACKET_TYPE_DISCONNECT: 2,
    PACKET_TYPE_NEW_CONNECTION: 3,
    PACKET_TYPE_INPUT: 4
}

var currentClientId = 1;
var clients = {};
var clientsIdMap = {};

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
        case PacketType.PACKET_TYPE_CONNECTION:
            const clientId = currentClientId;
            addToClients(remote.address, remote.port, clientId);
            sendClientConnectionAcknowledgement(remote.address, remote.port, clientId);
            currentClientId += 1;
            break;
        case PacketType.PACKET_TYPE_REQUEST_SPAWN:
            const spawnLocation = spawnLocations[Math.floor(Math.random() * spawnLocations.length)];
            // const spawnLocation = spawnLocations.pop();
            sendClientSpawnLocation(remote.address, remote.port, spawnLocation);
            broadcastNewClientSpawnLocation(clientId, spawnLocation);
            break;
        case PacketType.PACKET_TYPE_DISCONNECT:
            removeFromClients(remote.address);
        case PacketType.PACKET_TYPE_REQUEST_SPAWN:
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

function addToClients(address, port, clientId) {
    clients[address] = port;
    clientsIdMap[clientId] = address
}

function removeFromClients(address) {
    // TODO: Delete the clientId / address from the clientsIdMap
    delete clients[address];
}

function sendClientConnectionAcknowledgement(address, port, clientId) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt16LE(PacketType.PACKET_TYPE_CONNECTION);
    buffer.writeUInt16LE(clientId, 2);
    server.send(buffer, 0, buffer.length, port, address, function(error, bytes) {
        if (error) {
            console.log(`server error sending connection acknowledgement to ${address}:${port}`);
        }
        console.log(`server sent connection acknowledgement to ${address}:${port}`);
    });
}

function sendClientSpawnLocation(address, port, spawnLocation) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt16LE(PacketType.PACKET_TYPE_REQUEST_SPAWN);
    buffer.writeUInt16LE(spawnLocation, 2);
    console.log(buffer);
    server.send(buffer, 0, buffer.length, port, address, function(error, bytes) {
        if (error) {
            console.log(`server error sending spawn location of ${spawnLocation} to ${address}:${port}`);
        }
        console.log(`server sent spawn location of ${spawnLocation} to ${address}:${port}`);
    });
}

function broadcastNewClientSpawnLocation(ignoredClientId, spawnLocation) {
    const ignoredClientAddress = clientsIdMap[ignoredClientId];

    const buffer = Buffer.alloc(4);
    buffer.writeUInt16LE(PacketType.PACKET_TYPE_NEW_CONNECTION);
    buffer.writeUInt16LE(spawnLocation, 2);
    for (const address in clients) {
        if (address == ignoredClientAddress) {
            continue
        }

        const port = clients[address];
        server.send(buffer, 0, buffer.length, port, address, function(error, bytes) {
            if (error) {
                console.log(`server error with broadcasting new client spawn location of ${spawnLocation} to ${address}:${port}`);
            }
            console.log(`server broadcasted new client spawn location of ${spawnLocation} to ${address}:${port}`);
        })
    }
}

server.bind(PORT, HOST);