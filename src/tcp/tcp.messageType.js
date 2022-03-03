/* eslint-disable object-curly-newline */
module.exports = {
  SYSTEM: {
    TCP: {
      START: () => 'C-C-00-0001-CMDGEN-_CNCT|000|',
    },
    POWER: {
      ON: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-___GO|000|`,
      OFF: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-__OFF|000|`,
    },
  },
  LOCO: {
    STOPALL: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-_STOP|000|`,
    STARTALL: ({ canal, commandNumber }) => `C-C-${canal}-${commandNumber}-CMDGEN-___GO|000|`,
    FUNC: ({ canal, commandNumber, addr, funcNumber, state }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-DCCSF`, `04|AD=${addr};MODE=128;STEP=0;FX${funcNumber}=${state};`),
    SPEED: {
      FORWARD: ({ canal, commandNumber, addr, speed }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-DCCSF`, `03|AD=${addr};MODE=128;STEP=${speed};`),
      REVERSE: ({ canal, commandNumber, addr, speed }) => buildString(`C-C-${canal}-${commandNumber}-CMDTRN-DCCSF`, `04|AD=${addr};MODE=128;STEP=${-Math.abs(speed)};INV=1;`),
    },
  },
  ACC: {
    STATE: ({ canal, commandNumber, addr, state }) => buildString(`C-C-${canal}-${commandNumber}-CMDACC-DCCAC`, `02|AD=${addr};STATE=${state};`),
  },
};

// Generic function to build string with string length
function buildString(startString, endString) {
  return `${startString}|${endString.length.toString().padStart(3, '0')}|${endString}`;
}
