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

var View       = require('./abstract'),
    Handlebars = require('handlebars'),
    util       = require('util'),
    Contacts;

/**
 * This page implements a listing for Minion's contacts.
 */
Contacts = function(minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(Contacts, View);

module.exports = Contacts;

Contacts.prototype.getTemplateName = function () {
    return 'contacts';
};

Contacts.prototype.getTemplateData = function () {
    var contacts = [];

    this._minion.getContacts().forEach(function (contact) {
        contacts.push({
            id:                contact.getId(),
            fullName:          contact.getFullName(),
            lastName:          contact.getLastName().toLowerCase(),
            emailAddress:      contact.getEmailAddress(),
            phoneNumber:       contact.getPhoneNumber(),
            allowCalls:        contact.getAllowCalls(),
            allowTextMessages: contact.getAllowTextMessages()
        });
    }, this);

    // Sort contacts by last name.
    contacts.sort(function(a, b) {
        if (a.lastName < b.lastName) {
            return -1;
        } else {
            return 1;
        }
    });

    this.registerHelper('boolean', this.renderBoolean);

    return {
        contacts: contacts    
    };
};

/**
 * Render boolean values as Yes/No.
 *
 * @param boolean value
 * @return String
 */
Contacts.prototype.renderBoolean = function (value) {
    return value ? 'Yes' : 'No';
};

