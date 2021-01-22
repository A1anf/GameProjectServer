const PORT = 33333;
const HOST = '104.248.77.64';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

var clients = [];

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', function() {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.on('message', function(message, remote) {
    let value = message.readUInt16LE(0).toString();
    console.log(`server got: ${value} from ${remote.address}:${remote.port}`);

    addToClients(remote.address, remote.port);
    repeatToClients(message)
});

function addToClients(address, port) {
    let clientData = {
        host: remote.address,
        port: remote.port
    };
    if (!clients.includes(clientData)) {
        clients.push(clientData);
    }
}

function repeatToClients(buffer) {
    clients.forEach(function(item, index, array) {
        server.send(buffer, 0, buffer.length, item.port, item.host, function(error, bytes) {
            if (error) {
                console.log(`server error with sending to ${item.host}:${item.port}`);
            }
            console.log(`server sent to client ${item.host}:${item.port}`);
        });
    });
    console.log(`server sent to all clients`);
}

server.bind(PORT, HOST);