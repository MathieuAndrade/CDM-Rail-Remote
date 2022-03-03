module.exports = function parseMessage(data) {
  if (!this.server.isCDMConnected && data.endsWith('CMDGEN-__ACK|000|')) {
    this.server.isCDMConnected = true;
    this.canal = data.substring(4, 6);
    this.server.websocketServer.sendUpdate();
  }
  console.log(data);
};
