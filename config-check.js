const { ConfigSchema } = require('./src/config.js');
const config = require('./config.json');

ConfigSchema.parse(config);
