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
    AbstractEdit;

AbstractEdit = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(AbstractEdit, View);

module.exports = AbstractEdit;

AbstractEdit.prototype.init = function () {
    var id          = this.getQuery('id'),
        Constructor = this.getDataObjectConstructor();

    this._errors = {};

    if (id) {
        this._dataObject = Constructor.find(this._minion, id);
    }

    if (!this._dataObject) {
        this._dataObject = new Constructor({}, this._minion);
    }

    this.initComplete();
};

AbstractEdit.prototype.validate = function () {
    throw "Add validate method to check input prior to save.";
};

AbstractEdit.prototype.getRedirectPath = function () {
    return '/';
};

AbstractEdit.prototype.addError = function (field, message) {
    if (-1 === this.getEditFields().indexOf(field)) {
        throw "Attempting to assign error to undeclared field '" + field + "'";
    }

    if ('undefined' === typeof this._errors[field]) {
        this._errors[field] = [];
    }

    this._errors[field].push(message);

    return this;
};

AbstractEdit.prototype.getDataObject = function () {
    if (! this._dataObject) {
        var Constructor  = this.getDataObjectConstructor();
        this._dataObject = new Constructor({}, this._minion);
    }

    return this._dataObject;
};

AbstractEdit.prototype.getTemplateData = function () {
    this.registerHelper('title', this.renderTitle)
        .registerHelper('field', this.renderField)
        .registerHelper('form', this.renderForm)
        .registerHelper('entry', this.renderEntry)
        .registerHelper('checkbox', this.renderCheckbox)
        .registerHelper('errors', this.renderErrors)
        .registerHelper('errorClass', this.renderErrorClass)
        .registerHelper('footer', this.renderFooter);

    if ('POST' === this._request.method) {
        this._renderValues = this.getPost();
    } else {
        this._renderValues = this.getEditValues();
    }

    return this._renderValues;
};

AbstractEdit.prototype.getRenderValue = function (id) {
    if (-1 === this.getEditFields().indexOf(id)) {
        throw "Attempt to get render value for unknown edit field '" + id + '"';
    }

    if ('undefined' === typeof this._renderValues[id]) {
        return '';    
    } else {
        return this._renderValues[id]; 
    }
};

AbstractEdit.prototype.getEditFields = function () {
    throw "Must return array of field IDs";
};

AbstractEdit.prototype.getEditValues = function () {
    var values = {};

    this.getEditFields().forEach(function (field) {
        values[field] = this.getDataObject().get(field);
    }, this);

    return values;
};

AbstractEdit.prototype.getPostValues = function () {
    var values = {};

    this.getEditFields().forEach(function (field) {
        values[field] = this.getPost(field);
    }, this);

    return values;
};

AbstractEdit.prototype.isValid = function () {
    this.validate();

    return 0 === Object.keys(this._errors).length;
};

AbstractEdit.prototype._validateRequiredFields = function (fields) {
    fields.forEach(function (field) {
        if (!this.getPost(field)) {
            this.addError(field, 'This field is required.');
        }
    }, this);

    return this;
};

AbstractEdit.prototype.post = function () {
    var self = this;

    if (! this.isValid()) {
        this.get();
        return; 
    } else {
        this._minion.getDb().collection(
            this.getDataObject().getDbCollection(), 
            function(err, collection) {
                self.save(collection);
            }
        );
    }
};

AbstractEdit.prototype.save = function (collection) {
    this.getDataObject().save(collection, this.getPostValues());
    
    this._response.writeHead(302, {'Location': this.getRedirectPath()});
    this._response.end();
};

AbstractEdit.prototype.renderTitle = function () {
    if (this.getDataObject().getId()) {
        return 'Edit ' + this.getDataObject().getTitle();
    } else {
        return 'Add ' + this.getDataObject().getBlankTitle();
    }
};

AbstractEdit.prototype.renderErrorClass = function (field) {
    if ('undefined' === typeof this._errors[field]) {
        return '';
    } else {
        return 'field_with_errors';
    }
};

AbstractEdit.prototype.renderErrors = function (field) {
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

/**
 * @todo Add CSRF token.
 */
AbstractEdit.prototype.renderForm = function (fn) {
    var out = '<form method="post">';
    out += fn();
    out += '</form>';
    return out;
};

AbstractEdit.prototype.renderField = function (id, title, note, fn) {
    var out = '';

    out += '<div class="field ' + this.renderErrorClass(id) + '">';

    out += '<label for="' + id + '">';
    out += title;
    out += '</label>';

    out += '<div class="field_content">';
    out += fn(id, title, note);
    out += '</div>';

    if (note) {
        out += '<div class="field_note">';
        out += note;
        out += '</div>';
    }

    out += this.renderErrors(id).toString();
    
    out += '</div>';

    return out;
};

AbstractEdit.prototype.renderEntry = function (field, size) {
    var out = '<input type="text" name="' + field + '" id="' + field + '"'
            + ' size="' + size + '" value="' + this.getRenderValue(field) 
            + '" />';

    return new Handlebars.SafeString(out);
};

AbstractEdit.prototype.renderCheckbox = function(field) {
    var checked = '';

    if (this.getRenderValue(field)) {
        checked = 'checked="checked"';
    }

    var out = '<input type="checkbox" name="' + field + '" id="' + field + '"'
            + ' ' + checked + ' value="1" />';

    return new Handlebars.SafeString(out);
};

AbstractEdit.prototype.renderFooter = function () {
    return new Handlebars.SafeString(
        '<div class="form_footer">'
      + '<input type="submit" value="Save" class="primary_button" />'
      + '</div>'
    );
};
