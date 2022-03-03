const handleMessage = require('./websocket.handleMessage');

class WebsocketServer {
  constructor(server) {
    this.server = server;
    this.clients = [];
    this.clientConnected = 0;
    this.handleMessage = handleMessage;
  }

  start() {
    this.server.wss.on('connection', (ws, req) => {
      const id = req.connection.remoteAddress;

      ws.on('close', () => this.onClose(id));

      ws.on('message', (data) => this.handleMessage(id, ws, data));
    });
    return null;
  }

  sendMessage(id, type, payload) {
    this.clients[id].ws.send(JSON.stringify({ type, payload }));
  }

  sendMessageToAll(type, payload) {
    Object.keys(this.clients).forEach((id) => {
      this.sendMessage(id, type, payload);
    });
  }

  sendUpdate() {
    this.sendMessageToAll('update', {
      clientCount: this.clientConnected - 1,
      isCDMConnected: this.server.isCDMConnected,
      throttleCount: this.server.throttleCount,
      needleCount: this.server.needleCount,
    });
  }

  onClose(id) {
    this.clientConnected -= 1;
    this.clients.filter((client) => client !== id);
    this.sendUpdate();
  }

  onConnect(id, ws) {
    this.clientConnected += 1;
    this.clients[id] = [];
    this.clients[id] = { ws };
    this.sendUpdate();
  }
}

module.exports = WebsocketServer;
