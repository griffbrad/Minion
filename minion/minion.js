/**
 * Copyright (c) 2009-2012, Brad Griffith <bgriffith@deltasys.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without 
 * modification, are permitted provided that the following conditions are met:
 * 
 * - Redistributions of source code must retain the above copyright notice, 
 *   this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice, 
 *   this list of conditions and the following disclaimer in the documentation 
 *   and/or other materials provided with the distribution.
 * - Neither the name of Brad Griffith nor the names of other contributors may 
 *   be used to endorse or promote products derived from this software without
 *   specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE 
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE 
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF 
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS 
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN 
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) 
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF 
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

var Site  = require('./site'),
    Web   = require('./web'),
    mongo = require('mongodb');

var Minion = function (config) {
    this._config = config;
    this._debug  = false;
    this._sites  = [];

    this._cappedCollections = ['log', 'notifications'];

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

        self._initCappedCollections(db);
    });
};

Minion.prototype._initCappedCollections = function (db) {
    var self = this;

    db.collectionNames(function (err, names) {
        var missing = [],
            index,
            name;

        self._cappedCollections.forEach(function (name) {
            if (-1 === names.indexOf(name)) {
                missing.push(name);
            }
        });

        if (!missing.length) {
            self._initSitesFromDb(db);
        } else {
            name  = missing.pop();
            index = self._cappedCollections.indexOf(name);

            delete self._cappedCollections[index];

            self._createCappedCollection(db, name);
        }
    });
};

Minion.prototype._initSitesFromDb = function (db) {
    var self = this;

    db.collection('sites', function (err, collection) {
        collection.find().toArray(function (err, items) {
            self._handleSites(items);
        });
    });
};

Minion.prototype._createCappedCollection = function (db, name) {
    var self    = this,
        options = { capped: true, size: 1024000000 };
       
    db.createCollection(name, options, function (err, collection) {
        self._initCappedCollections(db);
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
