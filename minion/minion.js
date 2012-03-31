var Site  = require('./site'),
    Web   = require('./web'),
    mongo = require('mongodb');

var Minion = function (config) {
    this._config = config;
    this._debug  = false;
    this._sites  = [];

    if (-1 !== process.argv.indexOf('--debug')) {
        this._debug = true;
        console.log('Debugging enabled...');
    }
};

Minion.prototype.getConfig = function () {
    return this._config;
};

Minion.prototype.getDb = function () {
    return this._db;
};

Minion.prototype.isDebug = function () {
    return this._debug;
};

Minion.prototype.run = function () {
    var server = new mongo.Server('localhost', 27017, { auto_reconnect: true }),
        db     = new mongo.Db('minion', server),
        self   = this;

    this._db = db;

    db.open(function (err, db) {
        if (err) {
            console.log('Could not connect to MongoDB');
            return;
        }

        db.collection('sites', function (err, collection) {
            collection.find().toArray(function (err, items) {
                self._handleSites(items);
            });
        });
    });
};

Minion.prototype._handleSites = function (siteData) {
    var self = this;

    siteData.forEach(function (site) {
        this._sites.push(new Site(site, this));
    }, this);

    this.check();

    setInterval(
        function () {
            self.check();
        }, 
        60000
    );

    this._web = new Web(this._config.web, this);
    this._web.run();
};

Minion.prototype.addSite = function(options) {
    this._sites.push(new Site(options, this));

    return this;
};

Minion.prototype.getSites = function () {
    return this._sites;
};

Minion.prototype.findSiteByUrl = function (url) {
    var match = null;

    this._sites.forEach(function (site) {
        if (site.getUrl() === url) {
            match = site;
        }
    }, this);

    return match;
};

Minion.prototype.check = function () {
    this._sites.forEach(function (site) {
        site.check()
    });
};

module.exports = Minion;
