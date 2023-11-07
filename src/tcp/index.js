const net = require('net');
const handleMessage = require('./tcp.handleMessage');
const messageType = require('./tcp.messageType');

module.exports = class TcpServer {
  constructor(server) {
    this.server = server;
    this.client = new net.Socket();
    this.handleMessage = handleMessage;
    this.messageType = messageType;
    this.canal = 0;
    this.commandCount = 0;
  }

  start() {
    this.client.connect(9999, '127.0.0.1', () => {
      this.client.on('data', (data) => this.handleMessage(data.toString()));

      this.client.on('error', (err) => console.log(err));

      this.client.on('close', () => {
        this.server.isCDMConnected = false;
        this.server.websocketServer.sendUpdate();
      });

      this.sendMessage({ mainClass: 'SYSTEM', subClass: 'TCP', func: 'START' });

      // Wait until server reponse on start
      setTimeout(() => {
        this.sendMessage({ mainClass: 'SYSTEM', subClass: 'TCP', func: 'SERVICES' });
        this.sendMessage({ mainClass: 'LOCO', func: 'DOWNLOAD' });
      }, 500);
    });
  }

  stop() {
    this.client.removeAllListeners();
    this.client.end();
    this.server.isCDMConnected = false;
    this.server.websocketServer.sendUpdate();

    // Reset client to ensure next connections works correctly
    this.client = new net.Socket();
  }

  sendMessage(options) {
    this.commandCount += 1;
    const { mainClass, subClass, func } = options;
    const params = Object.assign(options, { canal: this.canal, commandNumber: this.commandCount.toString().padStart(4, '0') });

    if (subClass) {
      this.client.write(this.messageType[mainClass][subClass][func](params));
      console.log('\x1b[30mSend: %s\x1b[0m', this.messageType[mainClass][subClass][func](params));
    } else {
      this.client.write(this.messageType[mainClass][func](params));
      console.log('\x1b[30mSend: %s\x1b[0m', this.messageType[mainClass][func](params));
    }
  }
};
