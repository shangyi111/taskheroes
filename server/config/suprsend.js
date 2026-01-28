const { Suprsend } = require("@suprsend/node-sdk");

const supr_client = new Suprsend(
  process.env.SUPRSEND_WORKSPACE_KEY, 
  process.env.SUPRSEND_WORKSPACE_SECRET
);

module.exports = supr_client;