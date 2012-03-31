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
