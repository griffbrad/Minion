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

/**
 * A base Object from which you can inherit to manage a lot of routine view
 * rendering tasks.  Just supply a template name and a hash of template data
 * to render a page.  If you need to process POST requests as well, implement
 * the post() method or inherit from AbstractEdit.
 *
 * @param Minion minion
 * @param Request request
 * @param Response response
 */
var View = function (minion, request, response) {
    this._minion       = minion;
    this._response     = response;
    this._request      = request;
    this._post         = {};
    this._renderLayout = true;
};

module.exports = View;

/**
 * This method kicks everything off.  The Web object will call this method once
 * it is done with all the HTTP legwork.
 */
View.prototype.process = function () {
    this.init();
};

/**
 * You can implement any logic that is shared by both get() and post() here.
 * For example, you might load up a data object or other resource in init().
 * Once you've completed your initialization work, call initComplete() to
 * resume execution.  This allows you to perform asynchronous operations
 * in init() without creating a race condition.
 */
View.prototype.init = function () {
    this.initComplete();
};

/**
 * Proceed to either post() or get() to complete the request after 
 * initialization.
 */
View.prototype.initComplete = function () {
    if ('POST' === this._request.method) {
        this.post();
    } else {
        this.get();
    }
};

/**
 * Set the POST data related to this request.
 *
 * @param Object postData
 * @retrn View
 */
View.prototype.setPostData = function (postData) {
    this._post = postData;

    return this;
};

/**
 * Process POST requests.  By default POST requests return a 403 Forbidden
 * response.  If you need to handle POSTs, override this method in your
 * inheriting object.
 */
View.prototype.post = function () {
    this._response.writeHead(403, {'Content-Type': 'text/plain'});
    this._response.write('Operation forbidden');
    this._response.end();
};

/**
 * Redirect to another path with a 302 (i.e. temporarily moved) status.
 *
 * @param String path
 */
View.prototype.redirect = function (path) {
    this._response.writeHead(302, { Location: path });
    this._response.end();
};

/**
 * Get one or more items from the POST data associated with this request.
 * You can optionally specify either a string key or an array of keys.
 * If you don't specify a key, the entire POST data hash will be returned.
 *
 * @return mixed
 */
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

/**
 * Get one or more items from the GET data associated with this request.
 * You can optionally specify either a string key or an array of keys.
 * If you don't specify a key, the entire GET data hash will be returned.
 *
 * @return mixed
 */
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

/**
 * Register a Handlebars helper.  Calling this method rather than interacting
 * with Handlebars directly will handle the callback in such a way that it
 * executes in the context of your view, which is often more convenient than
 * being limited to the information Handlebars passes to the callback directly.
 *
 * @param String name
 * @param Function callback
 * @return View
 */
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

/**
 * Get the full path to the template file to render for this view.
 *
 * @return String
 */
View.prototype.getTemplateFile = function () {
    return __dirname + '/../templates/' + this.getTemplateName() + '.html';
};

/**
 * Get the full path to the layout file used to render this view.  By default,
 * the View object implements the "2-step view" pattern where the view script
 * is rendered first and then merged into a placeholder in the layout script.
 *
 * @return String
 */
View.prototype.getLayoutFile = function () {
    return __dirname + '/../templates/main.html';
};

/**
 * Process GET requests.  By default this renders the view script and layout
 * script using the hash of information returned from getTemplateData().
 */
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
           
            if (!view._renderLayout) {
                view._response.write(
                    page(view.getTemplateData())
                );
            } else {
                Handlebars.registerPartial('page', page);

                layout = Handlebars.compile(layout);

                view._response.write(
                    layout(view.getTemplateData())
                );
            }
                
            view._response.end();
        });
    });
};
