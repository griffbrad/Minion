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

/**
 * This object provides an ActiveRecord-like abstraction of data mapping
 * objects.  Because we use MongoDB for storage, the state of these objects
 * maps much more closely to the documents stored in the DB than ActiveRecord-
 * style objects typical map to RDBMS rows.  For example, if an object 
 * inheriting from DataObject has a property with an array value, that array
 * will be stored in the same document as scalar properties in MongoDB.  The
 * ObjectID assigned by MongoDB is used to determine whether the DataObject
 * is newly created or already stored in the DB.
 *
 * @param Object options
 * @param Minion minion
 */
var DataObject = function (options, minion) {
    this._minion = minion;

    this.setOptions(options);
};

module.exports = DataObject;

/**
 * A static method used to find a DataObject instances based upon its ObjectID.
 *
 * @param Minion minion
 * @param String id
 */
DataObject.find = function (minion, id) {
    throw "Must implement find method";
};

/**
 * An abstract method that must be implemented by any objects inheriting from
 * DataObject.  This method should return the singular form of the title for
 * new instances of the object (e.g. A DataObject called "Book" would likely
 * return "Book" as its blank title).
 *
 * @return String
 */
DataObject.prototype.getBlankTitle = function () {
    throw 'Must implement getBlankTitle() method.';
};

/**
 * An abstract method that must be implemented by any objects inheriting from
 * DataObject.  This method should return a value that can serve as a title
 * for the object (e.g. A DataObject called "Contact" might return the contact's
 * full name as its title).
 *
 * @return String
 */
DataObject.prototype.getTitle = function () {
    throw "All data objects must implement a getTitle() method";
};

/**
 * Save the DataObject to a MongoDB object.  Optionally, you can provide a
 * callback and context of execution for that callback, which will be triggered
 * once the save has completed.  If the DataObject's getId() returns no value,
 * an insert will be performed.  Otherwise, an update will be performed.  
 * Updates use MongoDB's $set modifier, so only the fields in the supplied data
 * hash will be modified.  The document as a whole will not be replaced, as
 * would occur in a convention MongoDB update call.
 *
 * @param MongoDB.Collection collection
 * @param Object data
 * @param Function callback
 * @param Object context
 */
DataObject.prototype.save = function (collection, data, callback, context) {
    var self = this;

    this.setOptions(data);

    if (!this.getId()) {
        collection.insert(
            data,
            function (err, docs) {
                self.setOptions(docs[0]);
                self.getAddMethod().call(self._minion, self);

                if (callback) {
                    callback.call(context);
                }
            }
        );
    } else {
        collection.update(
            { _id : new ObjectID(this.getId()) },
            { $set: data },
            { safe: true },
            function (err, result) {
                if (callback) {
                    callback.call(context);
                }
            }
        );
    }

    return this;
};

/**
 * Set this DataObject's options by iterating over a hash of key-value pairs.
 * Each key will be used to locate an applicable setter method (e.g. the
 * "color" key would call "setColor").  The setter method will be called with
 * the associated value as the first and only parameter.
 *
 * @param Object options
 * @return DataObject
 */
DataObject.prototype.setOptions = function (options) {
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            this.setOption(key, options[key]);
        }
    }

    return this;
};
  
/**
 * Set an option, using the option's name to locate the appropriate setter
 * method (e.g. the "color" option would call "setColor").  The value
 * will be supplied to the option's setter method as the first and only
 * parameter
 *
 * @param String option
 * @param mixed value
 * @return DataObject
 */
DataObject.prototype.setOption = function (option, value) {
    var method = this._buildPropertyMethodName('set', option);

    if (!this[method]) {
        if (this._minion.isDebug()) {
            console.log('Calling undefined setter: ' + method);
        }
        return;
    }

    this[method].call(this, value);

    return this;
};

/**
 * Set the ObjectID of this DataObject.  While setting, the id will be converted
 * to a string to make it easier to compare with in other areas in the 
 * application.  When talking directly with the MongoDB API, you may need to
 * convert the value back to an actual ObjectID value.
 *
 * @param ObjectID|String id
 * @return DataObject
 */
DataObject.prototype.setId = function (id) {
    this._id = String(id);

    return this;
};

/**
 * Get the DataObject's ObjectID as a string.
 *
 * @return String
 */
DataObject.prototype.getId = function () {
    return this._id;
};

/**
 * Get the value of a single option associated with this DataObject using the 
 * option's name.
 *
 * @param String key
 */
DataObject.prototype.get = function (key) {
    var method = this._buildPropertyMethodName('get', key);
    return this[method].call(this);
};

/**
 * Construct a getter or setter name using a verb (i.e. "get" or "set") and an
 * option name.
 *
 * @param String verb
 * @param String option
 * @param String
 */
DataObject.prototype._buildPropertyMethodName = function (verb, option) {
    var method = verb;
    option  = option.replace('_', '');
    method += option.charAt(0).toUpperCase() + option.substr(1);
    return method;
};

