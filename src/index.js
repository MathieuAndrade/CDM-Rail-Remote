const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');
const WebSocket = require('ws');
const WebsocketServer = require('./websocket');
const TcpServer = require('./tcp');

const rootPath = path.join(__dirname, '..');

class Server {
  constructor(options) {
    this.address = options.address;
    this.port = options.port;

    this.needleCount = 11;
    this.throttleCount = 2;
    this.isCDMConnected = false;
    this.app = null;
    this.websocketServer = null;
    this.wss = null;
    this.tcpServer = null;
  }

  start() {
    this.app = express();
    this.app.set('view engine', 'ejs');
    // middleware for parsing this.application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({ extended: true }));
    // middleware for json body parsing
    this.app.use(bodyParser.json());
    // compress all response
    this.app.use(compression());
    // server static files
    this.app.use('/static', express.static(`${rootPath}/static`));
    this.app.get('/', (request, response) => {
      response.render(`${rootPath}/views/index.ejs`, { needleCount: this.needleCount, throttleCount: this.throttleCount });
    });

    this.app.get('/init', (request, response) => {
      response.send({ needleCount: this.needleCount, throttleCount: this.throttleCount, isCDMConnected: this.isCDMConnected });
    });

    this.app.post('/throttle', (request, response) => {
      this.throttleCount = request.body.count;
      response.sendStatus(200);
    });

    this.app.post('/needle', (request, response) => {
      this.needleCount = request.body.count;
      response.sendStatus(200);
    });

    // initialize the WebSocket server instance
    this.wss = new WebSocket.Server({ port: this.port + 1 });
    this.websocketServer = new WebsocketServer(this);

    // start WebSocket server
    this.websocketServer.start();

    this.app.listen(this.port, () => {
      console.log('\n---\n\n\x1b[7m.: %s :.\x1b[0m\n', 'CDM-Rail Remote started');
      console.log(`CDM-Rail Remote running at http://${this.address}:${this.port}/`);
    });

    this.tcpServer = new TcpServer(this);
  }
}

module.exports = Server;
