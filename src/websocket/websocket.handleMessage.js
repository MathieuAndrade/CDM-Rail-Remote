module.exports = function parseMessage(id, ws, data) {
  const parseCommand = parseCommandFunc.bind(this);
  const message = JSON.parse(data);
  const { payload } = message;
  if (message.type === 'authenticate') {
    if (payload.token && payload.token === 'master' || payload.token === 'slave') {
      this.onConnect(id, ws);
    } else {
      ws.terminate();
    }
  } else {
    parseCommand(id, payload);
  }
};

function parseCommandFunc(id, payload) {
  const { command, params } = payload;
  let options = null;

  switch (command) {
    case 'SYSTEM.TCP':
      if (params === 'STOP') {
        this.server.tcpServer.stop();
      } else {
        this.server.tcpServer.start();
      }
      this.sendUpdate();
      break;
    case 'SYSTEM.POWER':
      options = {
        mainClass: 'SYSTEM',
        subClass: 'POWER',
        func: params.action,
      };

      this.server.tcpServer.sendMessage(options);
      break;
    case 'LOCO.STOPALL':
      options = {
        mainClass: 'LOCO',
        func: 'STOPALL',
      };

      this.server.tcpServer.sendMessage(options);
      break;
    case 'LOCO.STARTALL':
      options = {
        mainClass: 'LOCO',
        func: 'STARTALL',
      };

      this.server.tcpServer.sendMessage(options);
      break;
    case 'LOCO.SPEED':
      options = {
        mainClass: 'LOCO',
        subClass: 'SPEED',
        func: params.direction,
        name: params.name,
        speed: params.speed,
      };

      this.server.tcpServer.sendMessage(options);
      break;
    case 'LOCO.FUNC':
      options = {
        mainClass: 'LOCO',
        func: 'FUNC',
        name: params.name,
        funcNumber: params.funcNumber,
        state: params.state,
      };

      this.server.tcpServer.sendMessage(options);
      break;
    case 'LOCO.DOWNLOAD':
      this.sendMessage(id, 'trains', this.server.trains);
      break;
    case 'ACC.STATE':
      options = {
        mainClass: 'ACC',
        func: 'STATE',
        addr: params.addr,
        state: params.direction,
      };

      this.server.tcpServer.sendMessage(options);
      break;
    default:
      break;
  }
}
