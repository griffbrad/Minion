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

var Site    = require('./site'),
    Contact = require('./contact'),
    Web     = require('./web'),
    mongo   = require('mongodb');

/**
 * Root object that coordinates all the other components.  Accepting a config
 * ojbect, the Minion object will build a list of sites and contacts.  Once
 * initialized, Minion iterates through its sites and kicks off their checks.
 * If enabled, Minion will also start up the HTTP server for the web frontend.
 *
 * @param Object config
 */
var Minion = function (config) {
    var nodeIndex;

    this._config   = config;
    this._debug    = false;
    this._sites    = [];
    this._contacts = [];

    // The capped collections we expect to be present in MongoDB 
    this._cappedCollections = ['log', 'notifications'];

    if (-1 !== process.argv.indexOf('--debug')) {
        this._debug = true;
        console.log('Debugging enabled...');
    }

    if (-1 === process.argv.indexOf('--node')) {
        throw "Must specify node name with --node flag";
    } else {
        nodeIndex = process.argv.indexOf('--node');

        this._nodeKey = process.argv.splice(nodeIndex + 1, 1).pop();

        if ('undefined' === typeof this._config.nodes[this._nodeKey]) {
            throw 'No node defined with with name "' + this._nodeKey + '"';
        }
    }
};

module.exports = Minion;

/**
 * @return Object
 */
Minion.prototype.getConfig = function () {
    return this._config;
};

Minion.prototype.getNode = function () {
    return this._config.nodes[this._nodeKey];
};

/**
 * @return MongoDB
 */
Minion.prototype.getDb = function () {
    return this._db;
};

/**
 * @return boolean Whether debug mode is enabled.
 */
Minion.prototype.isDebug = function () {
    return this._debug;
};

/**
 * Kick off the execution of all checks and the web frontend.  At this stage,
 * the connection to MongoDB is made.  Once connected, we make sure the 
 * various collections expected are present and properly configured.
 *
 * @return void
 */
Minion.prototype.run = function () {
    var servers = [],
        nodeKey,
        node;

    for (nodeKey in this._config.nodes) {
        if (this._config.nodes.hasOwnProperty(nodeKey)) {
            node = this._config.nodes[nodeKey];

            servers.push(new mongo.Server(
                node.hostname,
                node.port || 27017,
                node.options || { auto_reconnect: true }
            ));
        }
    }

    var replica = new mongo.ReplSetServers(servers);
    
    var db   = new mongo.Db('minion', replica),
        self = this;

    this._db = db;

    db.open(function (err, db) {
        if (err) {
            console.log('Could not connect to MongoDB');
            return;
        }

        self._initCappedCollections(db);
    });
};

/**
 * Initialize capped collections.  We first make sure that all the collections
 * we expect are present.  Once that is confirmed, we begin initialization of
 * other application resources, like contacts and sites.
 *
 * @param MongoDB db
 */
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
            self._initContactsFromDb(db);
        } else {
            name  = missing.pop();
            index = self._cappedCollections.indexOf(name);

            delete self._cappedCollections[index];

            self._createCappedCollection(db, name);
        }
    });
};

/**
 * Initialize sites found in the Mongo database's "sites" collection.
 *
 * @param MongoDB db
 */
Minion.prototype._initSitesFromDb = function (db) {
    var self = this;

    db.collection('sites', function (err, collection) {
        collection.find().toArray(function (err, items) {
            self._handleSites(items);
        });
    });
};

/**
 * Initialize sites found in the Mongo database's "contacts" collection.
 *
 * @param MongoDB db
 */
Minion.prototype._initContactsFromDb = function (db) {
    var self = this;

    db.collection('contacts', function (err, collection) {
        collection.find().toArray(function (err, items) {
            self._handleContacts(items, db);
        });
    });
};

/**
 * Create a capped collection.  When we find that a capped collection doesn't
 * already exist, we call this method to create it.  The collections are 
 * currently created with a hard-coded 1GB size.  This will be configurable
 * down the line.
 *
 * @param MongoDB db
 * @param String name The name of the collection.
 */
Minion.prototype._createCappedCollection = function (db, name) {
    var self    = this,
        options = { capped: true, size: 1073741824 }; // 1GB
       
    db.createCollection(name, options, function (err, collection) {
        self._initCappedCollections(db);
    });
};

/**
 * Add all the sites listed in siteData to Minion's internal array of 
 * sites.  Once they're added, kick off their initial check and start the web
 * frontend.
 *
 * @param Array siteData
 */
Minion.prototype._handleSites = function (siteData) {
    var self = this;

    siteData.forEach(function (site) {
        this._sites.push(new Site(site, this));
    }, this);

    this.check();

    this._web = new Web(this._config.web, this);
    this._web.run();
};

/**
 * Add all the contacts listed in contactData to Minion's internal array of
 * contacts.  Once contacts have been stored, initialization is handed off to
 * the _handleSites() method.
 *
 * @param array contactData
 * @param MongoDB db
 */
Minion.prototype._handleContacts = function (contactData, db) {
    var self = this;

    contactData.forEach(function (contact) {
        this._contacts.push(new Contact(contact, this));
    }, this);

    this._initSitesFromDb(db);
};

/**
 * Add a Site object to Minion's internal sites array.
 *
 * @param Site site
 * @return Minion
 */
Minion.prototype.addSite = function (site) {
    this._sites.push(site);

    // Initiate first check for newly added site.
    site.check();
    
    return this;
};

/**
 * Get Minion's array of sites.
 * 
 * @return Array
 */
Minion.prototype.getSites = function () {
    return this._sites;
};

/**
 * Find a site by its Mongo ObjectID.
 *
 * @param String id
 * @return Site | null
 */
Minion.prototype.findSiteById = function (id) {
    return this._findById(this._sites, id);
};

/**
 * Add a contact to Minion's internal array of contacts.
 *
 * @param Contact contact
 * @return Minion
 */
Minion.prototype.addContact = function (contact) {
    this._contacts.push(contact);

    return this;
};

/**
 * Get an array of contacts.  Optionally, you can pass in an array of contact
 * ObjectIDs, which will be used to filter the results returned.  If now keys
 * are specified, Minion's full array of contacts will be returned.  The keys
 * parameter can come in handy when you only want to get the contact objects
 * associated with a certain site, for example.
 *
 * @param Array keys
 * @return Array
 */
Minion.prototype.getContacts = function (keys) {
    if ('undefined' === typeof keys) {
        return this._contacts;
    }

    var out = [];

    this._contacts.forEach(function (contact) {
        if (-1 !== keys.indexOf(contact.getId())) {
            out.push(contact);
        }
    });

    return out;
};

/**
 * Find a contact using their MongoDB ObjectID.
 *
 * @return Contact | null
 */
Minion.prototype.findContactById = function (id) {
    return this._findById(this._contacts, id);
};

/**
 * Method to kick off the initial round of checks on all sites.  After the 
 * initial run, each site uses setTimeout() to schedule its future checks
 * according the intervals configured for them.
 */
Minion.prototype.check = function () {
    this._sites.forEach(function (site) {
        site.check()
    });
};

/**
 * Find a DataObject contained in the supplied items array using the MongoDB
 * ObjectID supplied in the second parameter.
 *
 * @param Array items
 * @param String id
 *
 * @return DataObject
 */
Minion.prototype._findById = function (items, id) {
    var match = null;

    items.forEach(function (item) {
        if (item.getId() === id) {
            match = item;
        }
    }, this);

    return match;
};
