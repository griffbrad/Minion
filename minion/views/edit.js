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
    url          = require('url'),
    Edit;

Edit = function (minion, request, response) {
    AbstractEdit.apply(this, arguments);
};

util.inherits(Edit, AbstractEdit);

module.exports = Edit;

Edit.prototype.getTemplateName = function () {
    return 'edit';
};

Edit.prototype.getBlankTitle = function () {
    return 'Check';
};

Edit.prototype.getAddMethod = function () {
    return this._minion.addSite;
};

Edit.prototype.getDefaultValues = function () {
    return {
        repeatsBeforeNotification: 5 
    };
};

Edit.prototype.getEditFields = function () {
    return ['url', 'contentString', 'repeatsBeforeNotification'];
};

Edit.prototype.getDbCollection = function () {
    return 'sites';
};

Edit.prototype.findDataObject = function (id) {
    return this._minion.findSiteById(id);
};

Edit.prototype.validate = function () {
    if (!this.getPost('url')) {
        this.addError('url', 'This field is required.');
    }
    
    if (!this.getPost('repeatsBeforeNotification')) {
        this.addError('repeatsBeforeNotification', 'This field is required.');
    }

    var urlInfo = url.parse('http://' + this.getPost('url')),
        repeats = parseInt(this.getPost('repeatsBeforeNotification'));

    if (!urlInfo.hostname) {
        this.addError('url', 'Please enter a valid hostname.');
    } else {
        this._post.url = urlInfo.hostname;
    }

    if (isNaN(repeats) || repeats < 0 || repeats > 60) {
        this.addError(
            'repeatsBeforeNotification',
            'Please enter a positive integer less than 60.'
        );
    }
};

