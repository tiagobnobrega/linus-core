const pjson = require("./package.json");

const { version } = pjson;
const b = {
  a: "b"
};

console.log("b", b);
module.exports = {
  version
};
