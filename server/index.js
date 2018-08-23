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

    var chunks = [];
    socket.on('chunk', (buffer) => {
        chunks.push(buffer);
    });
    socket.on('save', () => {
        // fluent-ffmpeg 视频格式转换
        fs.writeFile('dist/video_' + chunks.length + '.mp4', Buffer.concat(chunks));
        chunks = [];
    });
});
