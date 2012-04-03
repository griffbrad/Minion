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

var Base = require('./base'),
    util = require('util');

var Contact = function (options, minion) {
    this._allowCalls        = true;
    this._allowTextMessages = true;

    Base.apply(this, arguments);
};

util.inherits(Contact, Base);

module.exports = Contact;

Contact.find = function (minion, id) {
    return minion.findContactById(id);
};

Contact.prototype.getAddMethod = function () {
    return this._minion.addContact;
};

Contact.prototype.getDbCollection = function () {
    return 'contacts';
};

Contact.prototype.getTitle = function () {
    return this.getFullName();
};

Contact.prototype.getBlankTitle = function () {
    return 'Contact';
};

Contact.prototype.setFirstName = function (firstName) {
    this._firstName = firstName;

    return this;
};

Contact.prototype.getFirstName = function () {
    return this._firstName;
};

Contact.prototype.setLastName = function (lastName) {
    this._lastName = lastName;

    return this;
};

Contact.prototype.getLastName = function () {
    return this._lastName;
};

Contact.prototype.getFullName = function () {
    return this._firstName + ' ' + this._lastName;
};

Contact.prototype.setEmailAddress = function (emailAddress) {
    this._emailAddress = emailAddress;

    return this;
};

Contact.prototype.getEmailAddress = function () {
    return this._emailAddress;
};

Contact.prototype.getEmailAddress = function () {
    return this._emailAddress;
};

Contact.prototype.setPhoneNumber = function (phoneNumber) {
    this._phoneNumber = phoneNumber;

    return this;
};

Contact.prototype.getPhoneNumber = function () {
    return this._phoneNumber;
};

Contact.prototype.setAllowCalls = function (allow) {
    this._allowCalls = allow;

    return this;
};

Contact.prototype.getAllowCalls = function () {
    return this._allowCalls;
};

Contact.prototype.setAllowTextMessages = function (allow) {
    this._allowTextMessages = allow;

    return this;
};

Contact.prototype.getAllowTextMessages = function () {
    return this._allowTextMessages;
};
