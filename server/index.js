var https = require('https'),
    fs = require("fs"),
    ip = require('ip'),
    express = require('express');

var app = express();
var options = {
    key: fs.readFileSync('server/privatekey.pem'),
    cert: fs.readFileSync('server/certificate.pem')
};
var port = 8443;

app.use(express.static(require('path').join(__dirname, '../')));

var server = https.createServer(options, app).listen(port, function () {
    console.log('Https server listening on https://' + ip.address() + ':' + port);
});

var io = require('socket.io')(server);
io.on('connection', function (socket) {

    socket.on('offer', (packet) => {
        socket.broadcast.emit('offer', packet)
    });

    socket.on('answer', (packet) => {
        socket.broadcast.emit('answer', packet)
    });

    socket.on('ice', (packet) => {
        socket.broadcast.emit('ice', packet)
    });

    var bufferHelper = new BufferHelper();
    socket.on('chunk', (buffer) => {
        bufferHelper.concat(buffer);
    });
    socket.on('save', () => {
        fs.writeFile('video.mp4', bufferHelper.toBuffer())
    });
});

function BufferHelper() {
    this.buffers = [];
    this.size = 0;
    this.status = "changed";
};

BufferHelper.prototype.concat = function (buffer) {
    this.buffers.push(buffer);
    this.size += buffer.length;
    return this;
};

BufferHelper.prototype.toBuffer = function () {
    var data = null;
    var buffers = this.buffers, len = buffers.length;

    if (this.status === "computed") {
        return this.buffer;
    }

    switch(len) {
        case 0:
            data = new Buffer(0);
            break;
        case 1:
            data = buffers[0];
            break;
        default:
            data = new Buffer(this.size);
            for (var i = 0, pos = 0; i < len; i++) {
                var buffer = buffers[i];
                buffer.copy(data, pos);
                pos += buffer.length;
            }
            break;
    }

    this.status = "computed";
    this.buffer = data;
    return data;
};