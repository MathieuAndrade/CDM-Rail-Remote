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

      this.client.on('close', () => {
        this.server.isCDMConnected = false;
        this.server.websocketServer.sendUpdate();
      });

      this.sendMessage({ mainClass: 'SYSTEM', subClass: 'TCP', func: 'START' });
    });
  }

  stop() {
    this.client.end();
    this.server.isCDMConnected = false;
    this.server.websocketServer.sendUpdate();
  }

  sendMessage(options) {
    this.commandCount += 1;
    const { mainClass, subClass, func } = options;
    const params = Object.assign(options, { canal: this.canal, commandNumber: this.commandCount.toString().padStart(4, '0') });

    if (subClass) {
      this.client.write(this.messageType[mainClass][subClass][func](params));
      console.log(this.messageType[mainClass][subClass][func](params));
    } else {
      this.client.write(this.messageType[mainClass][func](params));
      console.log(this.messageType[mainClass][func](params));
    }
  }
};
