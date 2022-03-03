/* eslint-disable no-undef */
const { shell, remote } = require('electron');
const { Menu, MenuItem } = require('electron').remote;
const customTitlebar = require('custom-electron-titlebar');

// Variables
let titleBar = null;
let titleBarMenu = null;
let ws = null;
let websocketConnected = false;
let isCDMConnected = false;
let clientCount = 1;

// Main funciton
(async () => {
  initTitleBar();
  initWebsocket();

  // Open links externally by default
  document.addEventListener('click', (event) => {
    if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
      event.preventDefault();
      shell.openExternal(event.target.href);
    }
  });
})();

function initWebsocket() {
  const websocketUrl = 'ws://localhost:9000/';

  ws = new WebSocket(websocketUrl);

  ws.onopen = () => {
    console.log('Websocket Connected');
    websocketConnected = true;

    ws.onmessage = parseMessage;

    ws.send(
      JSON.stringify({
        type: 'authenticate',
        payload: {
          token: 'master',
        },
      }),
    );
  };

  ws.onerror = (e) => {
    console.log('Error', e);
  };

  ws.onclose = (e) => {
    console.log('Websocket disconnected');
    console.log('Error', e);
    websocketConnected = false;
  };
}

function initTitleBar() {
  titleBar = new customTitlebar.Titlebar({
    backgroundColor: customTitlebar.Color.fromHex('#fff'),
    shadow: false,
    maximizable: false,
    icon: '../static/icons/icon_black.png',
    unfocusEffect: false,
  });

  titleBar.updateTitle('CDM-Rail Remote');

  titleBarMenu = new Menu();
  titleBarMenu.append(new MenuItem({
    label: 'Fichier',
    submenu: [
      { label: 'Connexion à CDM-Rail', click: () => setTcpConnection() },
      { label: 'Deconnexion de CDM-Rail', click: () => setTcpConnection('stop') },
      { type: 'separator' },
      { label: 'Quitter', click: () => remote.getCurrentWindow().close() },
    ],
  }));

  /*
  titleBarMenu.append(new MenuItem({
    label: 'Options',
    submenu: [
       { label: 'Mode sombre' },
      { label: 'Paramètres IP', click: () => UIkit.modal(document.getElementById('modal-params')).show() },
    ],
  }));
  */

  titleBarMenu.append(new MenuItem({
    label: 'Aide',
    submenu: [
      { label: 'Forum CDM-Rail', click: () => shell.openExternal('http://cdmrail.free.fr/ForumCDR/index.php') },
      /* {label: 'Rapport de bug',}, */
      /* {label: 'Demande de fonctionalité',}, */
      { type: 'separator' },
      { label: 'À propos', click: () => UIkit.modal(document.getElementById('modal-version')).show() },
    ],
  }));

  titleBar.updateMenu(titleBarMenu);
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
  isCDMConnected = options.isCDMConnected;
  clientCount = options.clientCount;

  document.getElementById('clientCount').innerHTML = clientCount;

  if (!isCDMConnected) {
    UIkit.modal(document.getElementById('modal-CDMConnection')).show();
  } else {
    UIkit.modal(document.getElementById('modal-CDMConnection')).hide();
  }
}

function parseMessage(message) {
  const data = JSON.parse(message.data);

  switch (data.type) {
    case 'update':
      setState(data.payload);
      break;
    default:
      break;
  }
}

// Triggered by html
// eslint-disable-next-line no-unused-vars
function onChangeConnectionInfo() {
  const addressInput = document.getElementById('addressInput');
  const portInput = document.getElementById('portInput');
  const ip = addressInput.value;
  const port = portInput.value;

  if (validateIpAddress(ip)) {
    addressInput.classList.remove('uk-form-danger');
  } else {
    addressInput.classList.add('uk-form-danger');
    return;
  }

  if (validatePort(port)) {
    portInput.classList.remove('uk-form-danger');
  } else {
    portInput.classList.add('uk-form-danger');
    return;
  }

  // TODO: test connection
  console.log('hey');
}

function setTcpConnection(action = 'start') {
  if (isCDMConnected && action === 'stop') {
    sendMessage('SYSTEM.TCP', 'STOP');
  } else if (!isCDMConnected && action === 'start') {
    sendMessage('SYSTEM.TCP', 'START');
  }
}

function validateIpAddress(ipAddress) {
  const regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (regex.test(ipAddress)) {
    return true;
  }
  return false;
}

function validatePort(ipAddress) {
  const regex = /^(102[4-9]|10[3-9]\d|1[1-9]\d{2}|[2-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/;
  if (regex.test(ipAddress)) {
    return true;
  }
  return false;
}
