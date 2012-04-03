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

var ObjectID = require('mongodb').ObjectID;

var DataObject = function (options, minion) {
    this._minion = minion;

    this.setOptions(options);
};

module.exports = DataObject;

DataObject.prototype.save = function (collection, data) {
    var self = this;

    this.setOptions(data);

    if (!this.getId()) {
        collection.insert(
            data,
            function (err, docs) {
                self.setOptions(docs[0]);
                self.getAddMethod().call(self._minion, self);
            }
        );
    } else {
        collection.update(
            { _id : new ObjectID(this.getId()) },
            { $set: data },
            { safe: true },
            function (err, result) {
            }
        );
    }

    return this;
};

DataObject.find = function (minion, id) {
    throw "Must implement find method";
};

DataObject.prototype.setOptions = function (options) {
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            this.setOption(key, options[key]);
        }
    }
};
    
DataObject.prototype.setOption = function (option, value) {
    var method = this._buildPropertyMethodName('set', option);

    if (!this[method]) {
        if (this._minion.isDebug()) {
            console.log('Calling undefined setter: ' + method);
        }
        return;
    }

    this[method].call(this, value);
};

DataObject.prototype.getBlankTitle = function () {
    throw 'Must implement getBlankTitle() method.';
};

DataObject.prototype.setId = function (id) {
    this._id = String(id);

    return this;
};

DataObject.prototype.getId = function () {
    return this._id;
};

DataObject.prototype.get = function (key) {
    var method = this._buildPropertyMethodName('get', key);
    return this[method].call(this);
};

DataObject.prototype._buildPropertyMethodName = function (verb, option) {
    var method = verb;
    option  = option.replace('_', '');
    method += option.charAt(0).toUpperCase() + option.substr(1);
    return method;
};

DataObject.prototype.getTitle = function () {
    throw "All data objects must implement a getTitle() method";
};
