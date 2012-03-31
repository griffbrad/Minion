var View       = require('./abstract'),
    util       = require('util'),
    url        = require('url'),
    Handlebars = require('Handlebars'),
    Edit;

Edit = function(minion, request, response) {
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
