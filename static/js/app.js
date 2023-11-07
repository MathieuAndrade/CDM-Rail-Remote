/* eslint-disable no-undef */
// Variables
const maxStep = 126;
const directionsThrottle = [];
let needleCount = 11;
let url = null;
let ws = null;
let throttleCount = 2;
let websocketConnected = false;
let isCDMConnected = false;
let gaugeCenterX = 0;
let gaugeCenterY = 0;
let maxSpeed = 140;
let selectedTrain = null;
let trains = {};

// Main funciton
(async () => {
  url = window.location.origin;
  initWebsocket();
  await request('GET', {}, '/init', false);

  document.getElementById('firstNeedleAddr').addEventListener('change', onChangeNeedleFirstAddr);
  document.getElementById('needlesCount').addEventListener('change', onChangeNeedleCount);

  for (let i = 1; i < throttleCount; i++) {
    drawGauge(0, i);
    document.getElementById(`sliderMeter${i}`).addEventListener('input', onChangeSlider);
    document.getElementById(`gaugeMeter${i}`).addEventListener('click', onClickGauge);
    document.getElementById(`train${i}`).addEventListener('change', (e) => onTrainChange(e, i));
  }
})();

function initWebsocket() {
  const port = parseInt(window.location.origin.split(':').pop()); // Get port of page to calculate the websocket port

  // Build websocket websocket url
  // Replace http by ws and remove http port
  const websocketUrl = `${url.replace('http', 'ws').slice(0, -4)}${port + 1}`;

  ws = new WebSocket(websocketUrl);

  ws.onopen = () => {
    console.log('Connected!');
    websocketConnected = true;

    ws.onmessage = parseMessage;

    ws.send(
      JSON.stringify({
        type: 'authenticate',
        payload: {
          token: 'slave',
        },
      }),
    );

    sendMessage('LOCO.DOWNLOAD');
  };

  ws.onerror = (e) => {
    console.log('Error', e);
    UIkit.modal(document.getElementById('modal-lostConnection')).show();
  };

  ws.onclose = (e) => {
    console.log(e);
    console.log('disconnected');
    UIkit.modal(document.getElementById('modal-lostConnection')).show();
    websocketConnected = false;
  };
}

/** Listeners */

function drawGauge(value, index) {
  const gaugeMeter = document.getElementById(`gaugeMeter${index}`);
  const gaugeContext = gaugeMeter.getContext('2d');
  gaugeCenterX = gaugeMeter.width / 2;
  gaugeCenterY = gaugeMeter.height / 2 + 10;

  const needleLength = 75;
  const radius = 120;
  const textSize = 20;
  const stepsNumber = 5;
  const a90deg = Math.PI / 2;
  const degSpeed = Math.round((value * 270) / maxStep);
  const speed = Math.round((value * maxSpeed) / maxStep);
  const needleRadian = (degSpeed + 135) * Math.PI / 180;
  const needleX = gaugeCenterX + needleLength * Math.cos(needleRadian);
  const needleY = gaugeCenterY + needleLength * Math.sin(needleRadian);

  gaugeContext.clearRect(0, 0, 300, 250);

  // Draw the main arc
  gaugeContext.beginPath();
  gaugeContext.arc(gaugeCenterX, gaugeCenterY, radius, 0.75 * Math.PI, 0.25 * Math.PI, false);
  gaugeContext.lineWidth = 17;
  gaugeContext.lineCap = 'round';
  gaugeContext.strokeStyle = '#efefef';
  gaugeContext.stroke();

  // Draw the secondary arc
  gaugeContext.beginPath();
  gaugeContext.arc(gaugeCenterX, gaugeCenterY, 100, 0.75 * Math.PI, 0.25 * Math.PI, false);
  gaugeContext.lineWidth = 1;
  gaugeContext.strokeStyle = '#efefef';
  gaugeContext.stroke();

  // Draw a circle on center
  gaugeContext.beginPath();
  gaugeContext.arc(gaugeCenterX, gaugeCenterY, 12, 0, 2 * Math.PI, false);
  gaugeContext.fillStyle = '#efefef';
  gaugeContext.fill();

  // Draw legend text
  gaugeContext.fillStyle = '#666';
  gaugeContext.font = `${textSize * 0.55}px 'arial'`;

  for (let i = 0; i <= stepsNumber; i++) {
    const radian = ((270 / stepsNumber) * i + 135) * Math.PI / 180;
    const x = gaugeCenterX + (needleLength + 8) * Math.cos(radian) - textSize / 4;
    const y = gaugeCenterY + (needleLength + 8) * Math.sin(radian) + textSize / 4;
    const val = parseInt(i * maxSpeed / stepsNumber);
    gaugeContext.fillText(val, x - (gaugeContext.measureText('0').width / 2), y);
  }

  // Draw speed text
  gaugeContext.fillStyle = '#000';
  gaugeContext.font = `bold ${textSize}px 'arial'`;
  gaugeContext.fillText(Math.round(value * maxSpeed / maxStep), gaugeCenterX - (gaugeContext.measureText(speed).width / 2), gaugeCenterY + 400 / 5);
  gaugeContext.fillText('km/h', gaugeCenterX - (gaugeContext.measureText('km/h').width / 2), gaugeCenterY + 400 / 3.8);

  // Draw a needle
  gaugeContext.strokeStyle = '#467fcf';
  gaugeContext.fillStyle = '#467fcf';
  gaugeContext.beginPath();
  gaugeContext.moveTo(gaugeCenterX + 6 * Math.cos(needleRadian - a90deg), gaugeCenterY + 6 * Math.sin(needleRadian - a90deg));
  gaugeContext.lineTo(needleX, needleY);
  gaugeContext.lineTo(gaugeCenterX + 6 * Math.cos(needleRadian + a90deg), gaugeCenterY + 6 * Math.sin(needleRadian + a90deg));
  gaugeContext.closePath();
  gaugeContext.arc(gaugeCenterX, gaugeCenterY, 6, 0, Math.PI * 2);
  gaugeContext.fill();

  // Draw a speed arc
  if (speed > 0) {
    const grad = gaugeContext.createLinearGradient(100, -50, 330, 0);
    grad.addColorStop(0, '#467fcf');
    grad.addColorStop(1, '#cd201f');

    gaugeContext.beginPath();
    gaugeContext.arc(gaugeCenterX, gaugeCenterY, radius, 0.75 * Math.PI, needleRadian, false);
    gaugeContext.lineWidth = 17;
    gaugeContext.lineCap = 'round';
    gaugeContext.strokeStyle = grad;
    gaugeContext.stroke();
  }

  // Draw a point of needle
  gaugeContext.beginPath();
  gaugeContext.arc(gaugeCenterX, gaugeCenterY, 1, 0, 2 * Math.PI, false);
  gaugeContext.fillStyle = '#efefef';
  gaugeContext.fill();
}

function onClickGauge(e) {
  e.preventDefault();

  if (selectedTrain === null) {
    notificationTrain();
    return;
  }

  const { id } = e.target;
  const index = parseInt(id.substring(id.length - 1));
  let speed = 0;
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left - gaugeCenterX;
  const y = e.clientY - rect.top - gaugeCenterY;
  const theta = Math.atan2(y, x) + Math.PI;
  let thetaRad = (theta * 180 / Math.PI);

  // Ignore canvas's base
  if (thetaRad < 290 && thetaRad > 240) {
    return;
  } if (thetaRad <= 320 && thetaRad >= 300) {
    // Set tolerance for min speed
    thetaRad = 315;
  } else if (thetaRad >= 220 && thetaRad <= 240) {
    // Set tolerance for max speed
    thetaRad = 225;
  }

  // Normalize angle
  if (thetaRad > 300) {
    thetaRad = thetaRad - 360 + 45;
  } else {
    thetaRad += 45;
  }

  speed = Math.round((thetaRad) * maxStep / 270);
  drawGauge(speed, index);
  onSpeedChange(speed, index);
  document.getElementById(`sliderMeter${index}`).value = speed;
}

function onTrainChange(e, i) {
  e.preventDefault();

  selectedTrain = trains[e.target.value];
  setSelectedTrainState(i);
}

function onChangeSlider(e) {
  e.preventDefault();

  if (selectedTrain === null) {
    notificationTrain();
    document.getElementById('sliderMeter1').value = 0;
    return;
  }

  const { id } = e.target;
  const index = parseInt(id.substring(id.length - 1));
  const speed = parseInt(e.target.value);
  drawGauge(speed, index);
  onSpeedChange(speed, index);
}

function onChangeNeedleFirstAddr(e) {
  e.preventDefault();

  const addrAuto = document.getElementById('addrAuto').checked;
  if (addrAuto === false) {
    return;
  }

  let addr = parseInt(e.target.value);

  for (let i = 1; i < needleCount; i++) {
    document.getElementById(`needleAddr${i}`).value = addr;
    addr++;
  }
}

function onChangeNeedleCount(e) {
  e.preventDefault();
  request('POST', { count: e.target.value }, '/needle');
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickStopAndGo(index, action) {
  if (selectedTrain === null) {
    notificationTrain();
    return;
  }

  const speed = action === 'go' ? 126 : 0;

  drawGauge(speed, index);
  document.getElementById(`sliderMeter${index}`).value = speed;
  onSpeedChange(speed, index);
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickDirectionThrottle(index, direction) {
  directionsThrottle[index] = [];
  directionsThrottle[index] = [direction];
  drawGauge(0, index);
  onSpeedChange(0, index);
  document.getElementById(`sliderMeter${index}`).value = 0;
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickLocoFunc(index, state, funcNumber) {
  if (selectedTrain === null) {
    notificationTrain();
    return;
  }

  sendMessage('LOCO.FUNC', { name: selectedTrain.name, funcNumber, state });

  if (state === 1) {
    document.getElementById(`functionOn${funcNumber}`).hidden = true;
    document.getElementById(`functionOff${funcNumber}`).hidden = false;
  } else {
    document.getElementById(`functionOff${funcNumber}`).hidden = true;
    document.getElementById(`functionOn${funcNumber}`).hidden = false;
  }
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickPower(action) {
  sendMessage('SYSTEM.POWER', { action });

  if (action === 'ON') {
    document.getElementById('stateLabel').classList.remove('uk-label-danger');
    document.getElementById('stateLabel').classList.add('uk-label-success');
    document.getElementById('stateLabel').innerText = 'Etat: marche';
  } else {
    document.getElementById('stateLabel').classList.remove('uk-label-success');
    document.getElementById('stateLabel').classList.add('uk-label-danger');
    document.getElementById('stateLabel').innerText = 'Etat: arrêt';
  }
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onChangeNeedleType(index, type) {
  switch (type) {
    case 1:
      document.getElementById(`needleSimple${index}`).classList.remove('display-none');
      document.getElementById(`needleDouble${index}`).classList.add('display-none');
      document.getElementById(`crossover${index}`).classList.add('display-none');

      document.getElementById(`needleSimpleRadios${index}`).classList.remove('display-none');
      document.getElementById(`needleDoubleRadios${index}`).classList.add('display-none');
      document.getElementById(`crossoverRadios${index}`).classList.add('display-none');
      document.getElementById(`crossoverRadios2${index}`).classList.add('display-none');
      break;
    case 2:
      document.getElementById(`needleSimple${index}`).classList.add('display-none');
      document.getElementById(`needleDouble${index}`).classList.remove('display-none');
      document.getElementById(`crossover${index}`).classList.add('display-none');

      document.getElementById(`needleSimpleRadios${index}`).classList.add('display-none');
      document.getElementById(`needleDoubleRadios${index}`).classList.remove('display-none');
      document.getElementById(`crossoverRadios${index}`).classList.add('display-none');
      document.getElementById(`crossoverRadios2${index}`).classList.add('display-none');
      break;
    case 3:
      document.getElementById(`needleSimple${index}`).classList.add('display-none');
      document.getElementById(`needleDouble${index}`).classList.add('display-none');
      document.getElementById(`crossover${index}`).classList.remove('display-none');

      document.getElementById(`needleSimpleRadios${index}`).classList.add('display-none');
      document.getElementById(`needleDoubleRadios${index}`).classList.add('display-none');
      document.getElementById(`crossoverRadios${index}`).classList.remove('display-none');
      document.getElementById(`crossoverRadios2${index}`).classList.remove('display-none');
      break;
    default:
      break;
  }
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickAddThrottle(count) {
  request('POST', { count: parseInt(count) + 1 }, '/throttle');
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickNeedle(index, direction, type) {
  const addr = document.getElementById(`needleAddr${index}`).value;
  let oppositePosition = 0;
  let newDirection = direction;
  let pathList = null;

  switch (type) {
    case 'Double':
    case 'Simple':
      pathList = document.getElementById(`needle${type}${index}`).getElementsByTagName('path');
      resetFillPath(pathList);
      document.getElementById(`needle${type}Position${direction}${index}`).setAttribute('fill', '#316CBE');
      break;
    case 'crossover':
      pathList = document.getElementById(`crossover${index}`).getElementsByTagName('path');
      resetFillPath(pathList);
      oppositePosition = document.getElementById(`crossoverRadio3${index}`).checked ? 3 : 4;
      document.getElementById(`crossoverPosition${direction}${oppositePosition}${index}`).setAttribute('fill', '#316CBE');
      newDirection = `${direction}${oppositePosition}`;
      break;
    case 'crossover2':
      pathList = document.getElementById(`crossover${index}`).getElementsByTagName('path');
      resetFillPath(pathList);
      oppositePosition = document.getElementById(`crossoverRadio1${index}`).checked ? 1 : 2;
      document.getElementById(`crossoverPosition${oppositePosition}${direction}${index}`).setAttribute('fill', '#316CBE');
      newDirection = `${oppositePosition}${direction}`;
      break;
    default:
      break;
  }
  sendMessage('ACC.STATE', { addr: parseInt(addr), direction: parseInt(newDirection) });
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onClickStopAll(action) {
  if (action === 'STARTALL') {
    document.getElementById('startAll').parentElement.hidden = true;
    document.getElementById('stopAll').parentElement.hidden = false;
  } else {
    document.getElementById('stopAll').parentElement.hidden = true;
    document.getElementById('startAll').parentElement.hidden = false;
  }

  sendMessage(`LOCO.${action}`);
}

/** Utilities */

function notificationTrain() {
  UIkit.notification("<span uk-icon='icon: warning'></span> Aucun train sélectionné", { status: 'warning', timeout: 1000000 });
}

function resetFillPath(pathList) {
  for (let i = 0; i < pathList.length; i++) {
    pathList[i].setAttribute('fill', 'none');
  }
}

function onSpeedChange(value, index) {
  const speedKmh = Math.round((value * maxSpeed) / maxStep);
  const speedPercentage = Math.round((100 * speedKmh) / maxSpeed);

  if (speedKmh > 0) {
    document.getElementById(`go${index}`).hidden = true;
    document.getElementById(`stop${index}`).hidden = false;
  } else {
    document.getElementById(`stop${index}`).hidden = true;
    document.getElementById(`go${index}`).hidden = false;
  }

  // Get direction if exist
  let direction = 'FORWARD';
  if (directionsThrottle[index]) {
    // Eslint wants array destructuring but no chained assignment...
    const [first] = directionsThrottle[index];
    direction = first;
  }

  sendMessage('LOCO.SPEED', { name: selectedTrain.name, speed: speedPercentage, direction });
}

function sendMessage(command, params) {
  if (websocketConnected === true) {
    ws.send(
      JSON.stringify({
        type: 'command',
        payload: {
          command: command,
          params: params,
        },
      }),
    );
  }
}

function setState(options) {
  needleCount = options.needleCount;
  throttleCount = options.throttleCount;
  isCDMConnected = options.isCDMConnected;

  if (!isCDMConnected) {
    UIkit.modal(document.getElementById('modal-CDMConnection')).show();
  } else {
    UIkit.modal(document.getElementById('modal-CDMConnection')).hide();
  }
}

function setSelectedTrainState(index) {
  selectedTrain = trains[selectedTrain.name];
  maxSpeed = selectedTrain.tmax;

  if (selectedTrain.currentSpeed < 0) {
    selectedTrain.currentSpeed = Math.abs(selectedTrain.currentSpeed);
    document.getElementById(`forward${index}`).checked = false;
    document.getElementById(`revers${index}`).checked = true;
  } else {
    document.getElementById(`revers${index}`).checked = false;
    document.getElementById(`forward${index}`).checked = true;
  }

  if (selectedTrain.currentSpeed > 0) {
    document.getElementById(`go${index}`).hidden = true;
    document.getElementById(`stop${index}`).hidden = false;
  } else {
    document.getElementById(`stop${index}`).hidden = true;
    document.getElementById(`go${index}`).hidden = false;
  }

  selectedTrain.functions.forEach((f, i) => {
    if (f === 1) {
      document.getElementById(`functionOn${i}`).hidden = true;
      document.getElementById(`functionOff${i}`).hidden = false;
    } else {
      document.getElementById(`functionOff${i}`).hidden = true;
      document.getElementById(`functionOn${i}`).hidden = false;
    }
  });

  drawGauge(selectedTrain.currentSpeed || 0, index);
  document.getElementById(`sliderMeter${index}`).value = selectedTrain.currentSpeed || 0;
}

function parseMessage(message) {
  const data = JSON.parse(message.data);

  switch (data.type) {
    case 'update':
      setState(data.payload);
      break;
    case 'trains':
      trains = data.payload;

      if (selectedTrain) {
        setSelectedTrainState(1);
      }
      break;
    default:
      break;
  }
}

async function request(method, data, route, reload = true) {
  const params = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-cache',
  };

  if (method !== 'GET') {
    params.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${url}${route}`, params);

    if (reload) {
      window.location.reload();
    } else {
      const result = await response.json();
      setState(result);
    }
    return;
  } catch (error) {
    console.log(error);
  }
}
