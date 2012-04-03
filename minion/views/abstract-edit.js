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

/**
 * AbstractEdit provides an easy-to-use facility for editing a DataObject.
 * By supplying AbstractEdit with a few pieces of information, objects
 * inheriting from it can leverage several features:
 *
 * 1) Workflow for input validation, input processing, and saving.
 * 2) Rendering helpers for common form elements and messaging.
 * 3) Rendering of form values in a consistent manner.
 *
 * @param Minion minion
 * @param Request request
 * @param Response response
 */
AbstractEdit = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(AbstractEdit, View);

module.exports = AbstractEdit;

/**
 * Create the DataObject that will be edited using the constructor function
 * provied by getDataObjectContructor().  The query string parameter "id" will
 * be used to look-up an existing DataObject.  If one is not found, a new
 * DataObject will be created, but not saved until the form is submitted and
 * the user's input has been validated.
 */
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

/**
 * Validate user input.  If any errors are found in the input, call the 
 * addError() method to register them with AbstractEdit.  If any errors are
 * added, the input will not be saved.
 */
AbstractEdit.prototype.validate = function () {
    throw "Add validate method to check input prior to save.";
};

/**
 * The path to redirect to after saving.
 *
 * @return String
 */
AbstractEdit.prototype.getRedirectPath = function () {
    return '/';
};

/**
 * Add an error to one of the fields being edited.  During the validate()
 * method's execution, this method should be called when a problem is found in
 * the user's input.  If any errors have been added with this method, 
 * AbstractEdit will not proceed to saving the DataObject with the new input.
 * Rather, the get() method will be invoked, causing the page to be displayed
 * again with all validation errors displayed to the user.
 *
 * @param String field
 * @param String message
 * @return AbstractEdit
 */
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

/**
 * Get the DataObject being editing by this AbstractEdit instance.
 *
 * @return DataObject
 */
AbstractEdit.prototype.getDataObject = function () {
    if (! this._dataObject) {
        var Constructor  = this.getDataObjectConstructor();
        this._dataObject = new Constructor({}, this._minion);
    }

    return this._dataObject;
};

/**
 * Get the template data that Handlebars will have access to while rendering 
 * the view script for this object.  A variety of helpers are registered to
 * assist in rendering of typical CRUD forms.  More can be added to assist in
 * rendering a wider variety of controls.  If the current request is a POST,
 * the request's POST data will be used.  Otherwise, the DataObject's own
 * values will be passed along to Handlebars.
 *
 * @return Object
 */
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

/**
 * Get a value to render in the view script for this object.  The value
 * will come either from the request's POST data or the directly from the
 * associated DataObject, if a POST hasn't yet been performed.
 *
 * @param String id
 * @return mixed
 */
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

/**
 * Get a list of fields that will be editing by this object.  All objects
 * inheriting from AbstractEdit must implement this method.  Rather than
 * trusting that all the keys present in the POST data of the request should
 * be used for the edit operation, this list is used to constrict the changes
 * to the database to a known set of fields.  This avoids a security problem
 * common in Rails applications called "mass assignment".  Additionally,
 * attempts to assign validation errors or retrieve render values for fields
 * not listed in this method's returned array will cause an exception to be
 * thrown.  This is done to help prevent typos in field names causing tricky
 * bugs.
 *
 * @return Array
 */
AbstractEdit.prototype.getEditFields = function () {
    throw "Must return array of field IDs";
};

/**
 * Get values for the edit fields specified in getEditFields() from the
 * DataObject associated with this AbstractEdit instance.
 *
 * @return Object
 */
AbstractEdit.prototype.getEditValues = function () {
    var values = {};

    this.getEditFields().forEach(function (field) {
        values[field] = this.getDataObject().get(field);
    }, this);

    return values;
};

/**
 * Get values for the edit fields specified in getEditFields() from the
 * request's POST data.
 *
 * @return Object
 */
AbstractEdit.prototype.getPostValues = function () {
    var values = {};

    this.getEditFields().forEach(function (field) {
        values[field] = this.getPost(field);
    }, this);

    return values;
};

/**
 * Determine whether the user's input is valid.  The actual validation will
 * occur in an object inheriting from AbstractEdit.  Once that validation logic
 * has been run, AbstactEdit will see if there are any errors registered.
 *
 * @return boolean
 */
AbstractEdit.prototype.isValid = function () {
    this.validate();

    return 0 === Object.keys(this._errors).length;
};

/**
 * Validate the specified required fields have a value.
 *
 * @param Array fields
 * @return AbstractEdit
 */
AbstractEdit.prototype._validateRequiredFields = function (fields) {
    fields.forEach(function (field) {
        if (!this.getPost(field)) {
            this.addError(field, 'This field is required.');
        }
    }, this);

    return this;
};

/**
 * Handle a POST request.  If the user's input is found to be valid, we initiate
 * the process of getting the DataObject saved.  Otherwise, the processing is
 * handed off to the GET method to re-render the form and display validation
 * messages to the user.
 */
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

/**
 * Save the DataObject after validating the user's input on a POST request.
 * After the save is initiated, we redirect the response to the path
 * specified in getRedirectPath(), which defaults to "/", and then end the
 * response without waiting for the save operation to complete.
 *
 * @param MongoDBCollection collection
 */
AbstractEdit.prototype.save = function (collection) {
    this.getDataObject().save(collection, this.getPostValues());
    
    this._response.writeHead(302, {'Location': this.getRedirectPath()});
    this._response.end();
};

/**
 * Render a title for this AbstactEdit's related DataObject.  Depending on
 * whether it is a new DataObject being created or one being edited, either
 * getTitle() or getBlankTitle() will be called.
 *
 * @return String
 */
AbstractEdit.prototype.renderTitle = function () {
    if (this.getDataObject().getId()) {
        return 'Edit ' + this.getDataObject().getTitle();
    } else {
        return 'Add ' + this.getDataObject().getBlankTitle();
    }
};

/**
 * If any errors are assigned to the specified field, return a CSS class that 
 * can be used to alter the appearance of the entire field container to better
 * get the user's attention.
 *
 * @param String field
 * @return String
 */
AbstractEdit.prototype.renderErrorClass = function (field) {
    if ('undefined' === typeof this._errors[field]) {
        return '';
    } else {
        return 'field_with_errors';
    }
};

/**
 * Render a list of errors associated with the specified field.
 *
 * @param String field
 * @return String
 */
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
 * A block helper to render a form tag.  Doesn't do a whole log right now.
 *
 * @todo Add CSRF token.
 *
 * @return String
 */
AbstractEdit.prototype.renderForm = function (fn) {
    var out = '<form method="post">';
    out += fn();
    out += '</form>';
    return out;
};

/**
 * A block helper to render a div that wraps the contents of a form field with
 * a label, an explanatory note, and a list of errors, if any were added to the
 * field during validation.  In your Handlebars template, you need to specify
 * a value for the first three parameters, even if that value is an empty
 * string.
 *
 * The fourth parameter is a function generated by Handlebars to render the
 * content of the field.
 *
 * @param String id
 * @param String title
 * @param String note
 * @param Function fn 
 * @return String
 */
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

/**
 * Render a text input using the field parameter for the ID and name attributes
 * on the input tag and the size parameter for the corresponding attribute on
 * the rendered tag.
 * 
 * @param String field
 * @param integer size
 * @return String
 */
AbstractEdit.prototype.renderEntry = function (field, size) {
    var out = '<input type="text" name="' + field + '" id="' + field + '"'
            + ' size="' + size + '" value="' + this.getRenderValue(field) 
            + '" />';

    return new Handlebars.SafeString(out);
};

/**
 * Render a checkbox control using the field parameter for the ID and
 * name attributes on the input tag.
 *
 * @param String field
 * @return String
 */
AbstractEdit.prototype.renderCheckbox = function(field) {
    var checked = '';

    if (this.getRenderValue(field)) {
        checked = 'checked="checked"';
    }

    var out = '<input type="checkbox" name="' + field + '" id="' + field + '"'
            + ' ' + checked + ' value="1" />';

    return new Handlebars.SafeString(out);
};

/**
 * Render a form footer.  The footer just provides a simple wrapper and submit
 * button.
 *
 * @return String
 */
AbstractEdit.prototype.renderFooter = function () {
    return new Handlebars.SafeString(
        '<div class="form_footer">'
      + '<input type="submit" value="Save" class="primary_button" />'
      + '</div>'
    );
};
