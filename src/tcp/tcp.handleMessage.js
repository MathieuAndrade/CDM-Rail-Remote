module.exports = function parseMessage(data) {
  if (!this.server.isCDMConnected && data.endsWith('CMDGEN-__ACK|000|')) {
    this.server.isCDMConnected = true;
    this.canal = data.substring(4, 6);
    this.server.websocketServer.sendUpdate();
  }

  // Parse trains download informations
  if (this.server.isCDMConnected && data.includes('DSCTRN-SPEED')) {
    const cmdElements = data.split('|03|');
    const trainParams = cmdElements[1].split(';');

    // Build train object
    const train = {
      name: trainParams[0].split('=')[1],
      addr: trainParams[1].split('=')[1],
      tmax: trainParams[2].split('=')[1],
    };

    // And store it to send to clients
    this.server.trains[train.name] = train;
  }

  // Parse trains's event informations
  if (this.server.isCDMConnected && data.includes('CMDTRN-DCCSF')) {
    const cmdElements = data.split('|');
    const trainParams = cmdElements[3].split(';');

    // Map name
    let name = trainParams.filter((t) => t.includes('NAME'));
    name = name.map((f) => f.split('=')[1]);

    // Map current speed
    let curSpeed = trainParams.filter((t) => t.includes('CSTEP'));
    curSpeed = curSpeed.map((f) => f.split('=')[1]);

    // When speed is set to max, is not sended in event, this is a bug from server
    curSpeed = Number.isNaN(Number(curSpeed[0])) ? 126 : Number(curSpeed[0]);

    // Map functions
    let func = trainParams.filter((t) => t.includes('FX'));
    func = func.map((f) => parseInt(f.split('=')[1]));

    this.server.trains[name].currentSpeed = curSpeed;
    this.server.trains[name].functions = func;

    // Send update to all clients
    this.server.websocketServer.sendMessageToAll('trains', this.server.trains);
  }

  console.info('\x1b[36mCDM response: %s\x1b[0m', data);
};
