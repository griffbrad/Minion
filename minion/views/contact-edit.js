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

var AbstractEdit = require('./abstract-edit'),
    util         = require('util'),
    Contact      = require('../contact'),
    ContactEdit;

/**
 * ContactEdit implements a page for editing Contacts.
 */
ContactEdit = function (minion, request, response) {
    AbstractEdit.apply(this, arguments);
};

util.inherits(ContactEdit, AbstractEdit);

module.exports = ContactEdit;

ContactEdit.prototype.getDataObjectConstructor = function () {
    return Contact;
};

ContactEdit.prototype.getTemplateName = function () {
    return 'contact-edit';
};

ContactEdit.prototype.getEditFields = function () {
    return [
        'firstName',
        'lastName',
        'emailAddress',
        'phoneNumber',
        'allowTextMessages',
        'allowCalls',
        'notifyByDefault'
    ];
};

/**
 * Check required fields and email address field for valid input.
 */
ContactEdit.prototype.validate = function () {
    this._validateRequiredFields(['firstName', 'lastName', 'emailAddress', 'phoneNumber']);

    if (! this._validateEmailAddress(this.getPost('emailAddress'))) {
        this.addError(
            'emailAddress',
            'Please enter a valid email address.'
        );
    }
};

ContactEdit.prototype.getRedirectPath = function () {
    return '/contacts';
};

/**
 * Check that the given input matches the regular expression for valid email
 * addresses.
 *
 * @param String input
 * @return boolean
 */
ContactEdit.prototype._validateEmailAddress = function (input) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(input);
};
