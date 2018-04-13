const Dialog = require('./models/dialog');
const Rule = require('./models/rule');
const LaisDialog = require('./LaisDialog');

const LaisDialogRemote = async ({ updateInterval, ...rest } = {}) => {
  const me = {};
  let dialogEngine = null;
  updateInterval =
    updateInterval || process.env.LAIS_ADM_DATA_UPDATER_INTERVAL || -1;

  const getUpdatedDialogs = async () => {
    try {
      const dialogs = await Dialog.getAll();
      const rules = await Rule.getAll();
      return { dialogs, rules };
    } catch (err) {
      console.error('Errro updating dialogs and rules:', err);
    }
  };
  me.updateDialogs = async () => {
    console.log('Updating Dialogs And Rules...');
    const { dialogs, rules } = getUpdatedDialogs();
    console.log('dialogs', dialogs);
    console.log('rules', rules);
    if (dialogs) dialogEngine.setDialogs(dialogs);
    if (rules) dialogEngine.setRules(rules);
  };

  const { dialogs, rules } = await getUpdatedDialogs();
  dialogEngine = LaisDialog({ ...rest, dialogs, rules });

  if (updateInterval > 0) {
    const actualInterval = updateInterval >= 600 ? updateInterval : 600;
    console.log(
      `Starting auto-update interval of ${actualInterval}s for dialogs & rules`
    );
    me.updateInterval = setInterval(me.updateDialogs, actualInterval * 1000);
  }

  return dialogEngine;
};
module.exports = LaisDialogRemote;
