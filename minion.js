var Minion = require('./minion/'),
    config = require('./config');

var minion = new Minion(config);
minion.run();

