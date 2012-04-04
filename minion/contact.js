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

var DataObject = require('./data-object'),
    util       = require('util');

/**
 * A DataObject to manage contacts.  Contacts receive notifications when checks
 * fail or recover.  These objects manage the basic contact information for
 * the contacts.
 *
 * @param Object options
 * @param Minion minion
 */
var Contact = function (options, minion) {
    this._allowCalls        = true;
    this._allowTextMessages = true;
    this._notifyByDefault   = false;

    DataObject.apply(this, arguments);
};

util.inherits(Contact, DataObject);

module.exports = Contact;

/**
 * Find a Contact assigned to the Minion instance using the MongoDB ObjectID.
 *
 * @param Minion minion
 * @param String id
 * @return Contact
 */
Contact.find = function (minion, id) {
    return minion.findContactById(id);
};

/**
 * Save the contact's data to the DB.  If the "notifyByDefault" flag is 
 * activated while saving the contact, the contact will be added to all
 * existing checks.
 *
 * @param MongoDBCollection collection
 * @param Object data
 */
Contact.prototype.save = function (collection, data) {
    this._preSaveNotifyByDefaultValue = this.getNotifyByDefault();

    DataObject.prototype.save.call(
        this, 
        collection, 
        data, 
        this.postSave,
        this
    );
};

/**
 * Called after saving data.  If the "notifyByDefault" flag was activated while
 * saving, the contact will be added to all existing checks.
 */
Contact.prototype.postSave = function () {
    if (this.getNotifyByDefault() && !this._preSaveNotifyByDefaultValue) {
        this._addToAllChecks();
    }
};

/**
 * Add this contact to all existing checks.
 *
 * @return Contact
 */
Contact.prototype._addToAllChecks = function () {
    var self = this;

    this._minion.getDb().collection('sites', function (err, collection) {
        self._minion.getSites().forEach(function (site) {
            var contacts = site.getContacts();

            if (-1 === contacts.indexOf(this.getId())) {
                contacts.push(this.getId());

                site.save(
                    collection, 
                    { contacts: contacts }
                );
            }
        }, self);
    });

    return this;
};

/**
 * @return Function
 */
Contact.prototype.getAddMethod = function () {
    return this._minion.addContact;
};

/**
 * Get the name of the collection to which this object's data is saved.
 *
 * @return String
 */
Contact.prototype.getDbCollection = function () {
    return 'contacts';
};

/**
 * @return String
 */
Contact.prototype.getTitle = function () {
    return this.getFullName();
};

/**
 * @return String
 */
Contact.prototype.getBlankTitle = function () {
    return 'Contact';
};

/**
 * @param String firstName
 * @return Contact
 */
Contact.prototype.setFirstName = function (firstName) {
    this._firstName = firstName;

    return this;
};

/**
 * @return String
 */
Contact.prototype.getFirstName = function () {
    return this._firstName;
};

/**
 * @param String lastName
 * @return Contact
 */
Contact.prototype.setLastName = function (lastName) {
    this._lastName = lastName;

    return this;
};

/**
 * @return String
 */
Contact.prototype.getLastName = function () {
    return this._lastName;
};

/**
 * Get the contact's full name (i.e. first and last name concatenated).
 *
 * @return String
 */
Contact.prototype.getFullName = function () {
    return this._firstName + ' ' + this._lastName;
};

/**
 * Whether to include this contact in notifications for newly created checks.
 *
 * @param boolean notify
 * @return Contact
 */
Contact.prototype.setNotifyByDefault = function (notify) {
    this._notifyByDefault = notify;

    return this;
};

/**
 * @return boolean
 */
Contact.prototype.getNotifyByDefault = function () {
    return this._notifyByDefault;
};

/**
 * @param String emailAddress
 * @return Contact
 */
Contact.prototype.setEmailAddress = function (emailAddress) {
    this._emailAddress = emailAddress;

    return this;
};

/**
 * @return String
 */
Contact.prototype.getEmailAddress = function () {
    return this._emailAddress;
};

/**
 * @param String phoneNumber
 * @return Contact
 */
Contact.prototype.setPhoneNumber = function (phoneNumber) {
    this._phoneNumber = phoneNumber;

    return this;
};

/**
 * @return String
 */
Contact.prototype.getPhoneNumber = function () {
    return this._phoneNumber;
};

/**
 * @param boolean allow
 * @return Contact
 */
Contact.prototype.setAllowCalls = function (allow) {
    this._allowCalls = allow;

    return this;
};

/**
 * @return boolean
 */
Contact.prototype.getAllowCalls = function () {
    return this._allowCalls;
};

/**
 * @param boolean allow
 * @return Contact
 */
Contact.prototype.setAllowTextMessages = function (allow) {
    this._allowTextMessages = allow;

    return this;
};

/**
 * @return boolean
 */
Contact.prototype.getAllowTextMessages = function () {
    return this._allowTextMessages;
};
