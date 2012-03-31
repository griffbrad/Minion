var Handlebars  = require('handlebars'),
    fs          = require('fs'),
    querystring = require('querystring'),
    path        = require('path'),
    util        = require('util'),
    url         = require('url');

var View = function (minion, request, response) {
    this._minion   = minion;
    this._response = response;
    this._request  = request;
    this._post     = {};
};

module.exports = View;

View.prototype.process = function () {
    this.init();
};

View.prototype.init = function () {
    this.initComplete();
};

View.prototype.initComplete = function () {
    if ('POST' === this._request.method) {
        this.post();
    } else {
        this.get();
    }
};

View.prototype.setPostData = function (postData) {
    this._post = postData;

    return this;
};

View.prototype.post = function () {
    this._response.writeHead(403, {'Content-Type': 'text/plain'});
    this._response.write('Operation forbidden');
    this._response.end();
};

View.prototype.redirect = function (path) {
    this._response.writeHead(302, { Location: path });
    this._response.end();
};

View.prototype.getPost = function (key) {
    if (! key) {
        return this._post;
    } else if (!util.isArray(key)) {
        return this._post[key];
    } else {
        var out = {};

        key.forEach(function(item) {
            out[item] = this.getPost(item);
        }, this);

        return out;
    }
};

View.prototype.getQuery = function (key) {
    if ('undefined' === typeof this._query) {
        this._query = querystring.parse(url.parse(this._request.url).query);
    }

    if (! key) {
        return this._query;
    } else {
        return this._query[key];
    }
};

View.prototype.registerHelper = function (name, callback) {
    var self = this;

    Handlebars.registerHelper(name, function () {
        var out = callback.apply(self, arguments);

        // Hack to work around issue with SafeStrings
        if ('string' !== typeof out) {
            out = new Handlebars.SafeString(out);
        }

        return out;
    });

    return this;
};

View.prototype.getTemplateFile = function () {
    return __dirname + '/../templates/' + this.getTemplateName() + '.html';
};

View.prototype.getLayoutFile = function () {
    return __dirname + '/../templates/main.html';
};

View.prototype.get = function () {
    var stream  = fs.createReadStream(this.getTemplateFile()),
        content = '',
        view    = this;

    stream.on('data', function (data) {
        content += data;
    });

    stream.on('end', function (close) {
        var stream = fs.createReadStream(view.getLayoutFile()),
            layout = '';

        stream.on('data', function (data) {
            layout += data;
        });

        stream.on('end', function () {
            var page = Handlebars.compile(content);
            
            Handlebars.registerPartial('page', page);

            layout = Handlebars.compile(layout);

            view._response.write(
                layout(view.getTemplateData())
            );

            view._response.end();
        });
    });
};
