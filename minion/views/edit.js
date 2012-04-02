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
    util       = require('util'),
    url        = require('url'),
    Handlebars = require('handlebars'),
    Edit;

Edit = function (minion, request, response) {
    this._minion   = minion;
    this._response = response;
    this._request  = request;
};

util.inherits(Edit, View);

module.exports = Edit;

Edit.prototype.init = function () {
    var url  = this.getQuery('url');

    this._errors = {};

    if (url) {
        this._site = this._minion.findSiteByUrl(url);
    }

    this.initComplete();
};

Edit.prototype.post = function () {
    var self = this;

    if (! this.isValid()) {
        this.get();
        return; 
    } else {
        this._minion.getDb().collection('sites', function(err, collection) {
            var data = self.getPost(['url', 'contentString', 'repeatsBeforeNotification']);

            if (!self._site) {
                collection.insert(data);
                self._minion.addSite(data);
            } else {
                collection.update(
                    { url: url },
                    { $set: data },
                    { safe: true },
                    function (err, result) {}
                );

                self._site.setOptions(data);
            }
            
            self._response.writeHead(302, {'Location': '/'});
            self._response.end();
        });
    }
};

Edit.prototype.isValid = function () {
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

    return 0 === Object.keys(this._errors).length;
};

Edit.prototype.addError = function (field, message) {
    if ('undefined' === typeof this._errors[field]) {
        this._errors[field] = [];
    }

    this._errors[field].push(message);

    return this;
};

Edit.prototype.getTemplateName = function () {
    return 'edit';
};

Edit.prototype.getTemplateData = function () {
    this.registerHelper('title', this.renderTitle)
        .registerHelper('errors', this.renderErrors)
        .registerHelper('errorClass', this.renderErrorClass);

    if ('POST' === this._request.method) {
        return this.getPost();
    } else if (this._site) {
        return {
            url: this._site.getUrl(),
            repeatsBeforeNotification: this._site.getRepeatsBeforeNotification(),
            contentString: this._site.getContentString()
        };
    } else {
        return {
            repeatsBeforeNotification: 5 
        };
    }
};

Edit.prototype.renderTitle = function () {
    if (this._site) {
        return 'Edit ' + this._site.getUrl();
    } else {
        return 'Add Check';
    }
};

Edit.prototype.renderErrorClass = function (field) {
    if ('undefined' === typeof this._errors[field]) {
        return '';
    } else {
        return 'field_with_errors';
    }
};

Edit.prototype.renderErrors = function (field) {
    if ('undefined' === typeof this._errors[field]) {
        return '';
    }

    var out = '<ul class="field_errors">';

    this._errors[field].forEach(function (error) {
        out += '<li>' + error + '</li>';
    });

    out += '</ul>';

    return new Handlebars.SafeString(out);
};
