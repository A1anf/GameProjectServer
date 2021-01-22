const PORT = 33333;
const HOST = '104.248.77.64';

const dgram = require('dgram');
const server = dgram.createSocket('udp4');

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('listening', function() {
    const address = server.address();
    console.log(`server listening ${address.address}:${address.port}`);
});

server.on('message', function(message, remote) {
    console.log(`server got: ${message} from ${remote.address}:${remote.port}`);
});

server.bind(PORT, HOST);