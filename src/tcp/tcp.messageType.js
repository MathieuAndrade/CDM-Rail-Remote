/* eslint-disable object-curly-newline */
module.exports = {
  SYSTEM: {
    TCP: {
      START: () => 'C-C-00-0001-CMDGEN-_CNCT|000|',
      SERVICES: ({ canal, commandNumber }) => buildString(`C-C-${canal}-${commandNumber}-RQSERV-RTSIM`, '01|SRV=TDCC;'),
    },
    POWER: {
      ON: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-___GO|000|`,
      OFF: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-__OFF|000|`,
    },
  },
  LOCO: {
    STOPALL: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-_STOP|000|`,
    STARTALL: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-___GO|000|`,
    FUNC: ({ canal, commandNumber, name, funcNumber, state }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-DCCSF`, `02|NAME=${name};FX${funcNumber}=${state};`),
    SPEED: {
      FORWARD: ({ canal, commandNumber, name, speed }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-SPEED`, `02|NAME=${name};UREQ=${speed};`),
      REVERSE: ({ canal, commandNumber, name, speed }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-SPEED`, `02|NAME=${name};UREQ=${-Math.abs(speed)};`),
    },
    DOWNLOAD: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-DSCTRN-DLOAD|000|`,
  },
  ACC: {
    STATE: ({ canal, commandNumber, addr, state }) => buildString(`C-C-${canal}-${commandNumber}-CMDACC-DCCAC`, `02|AD=${addr};STATE=${state};`),
  },
};

// Generic function to build string with string length
function buildString(startString, endString) {
  return `${startString}|${endString.length.toString().padStart(3, '0')}|${endString}`;
}
