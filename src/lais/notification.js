const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const chalk = require('chalk');
const info = chalk.green.bgWhite;

let handlepost = function(req, res) {
  // console.log(info("REQ :"+req));
  // console.log(info("Notification :"+JSON.stringify(req.body,null,1)));
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({ status: 200, message: 'Notificação enviada com sucesso' });
};

module.exports = [bodyParser.json(), handlepost];
