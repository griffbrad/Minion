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

var http       = require('http'),
    fs         = require('fs'),
    url        = require('url'),
    path       = require('path'),
    querystring = require('querystring'),
    Handlebars = require('handlebars');

/**
 * This object manages the low-level HTTP APIs to support the web frontend.
 * Eventually, we plan to offer a simple HTTP-based web service to allow
 * for automated interactions with Minion as well.
 *
 * @param Object config The portion of the config related to the Web component.
 * @param Minion minion
 */
var Web = function (config, minion) {
    this._config = config || {};
    this._minion = minion;
};

module.exports = Web;

/**
 * Determine whether the web frontend should be enabled.  By default, it is
 * enabled.  To disable it, add the key "enabled" with a value of "false" to
 * the web section of your configuration file.
 *
 * @return boolean
 */
Web.prototype.isEnabled = function () {
    return 'undefined' === typeof this._config.enabled
        || this._config.enabled;
};

/**
 * Get the port to listen on when accepting HTTP requests to the web frontend.
 * By default, the port 9855 is used.
 *
 * @return integer
 */
Web.prototype.getPort = function () {
    return this._config.port || 9855;
};

/**
 * Run the web frontend, if it is enabled.  Otherwise, just return without
 * performing any further operations.
 */
Web.prototype.run = function () {
    if (!this.isEnabled()) {
        if (this._minion.isDebug()) {
            console.log('Skipping web server');
        }
        return;
    }

    var self = this;

    if (this._minion.isDebug()) {
        console.log('Starting web server on port ' + this.getPort());
    }

    http.createServer(function (req, res) {
        if ('POST' === req.method) {
            self.initPost(req, res);
        } else {
            self.route(req, res);
        }
    }).listen(this.getPort());
};

/**
 * Route an incoming request to the appropriate handler.  If no handler is
 * found, delegate further processing to the serveStatic() method.
 *
 * @todo Audit to ensure files outside views folder can't be accessed.
 *
 * @param Request request
 * @param Response response,
 * @param Object postData
 */
Web.prototype.route = function (req, res, postData) {
    var urlInfo     = url.parse(req.url),
        requirePath = urlInfo.pathname,
        filePath,
        self = this;

    if ('/' === requirePath) {
        requirePath = '/index';
    }

    filePath = __dirname + '/views' + requirePath + '.js'; 
    
    path.exists(filePath, function(exists) {
        if (!exists) {
            self.serveStatic(req, res);
        } else {
            var View = require('./views' + requirePath),
                view = new View(self._minion, req, res);

            if (postData) {
                view.setPostData(postData);
            }

            view.process();
        }
    });
};

/**
 * Gather body of POST request and parse it.  Once the POST data is in a
 * useable form, pass it on to the route() method for further processing.
 *
 * @param Request request
 * @param Response response
 */
Web.prototype.initPost = function (req, res) {
    var post = '',
        self = this;

    req.setEncoding('utf8');

    req.on('data', function (chunk) {
        post += chunk;
    });

    req.on('end', function () {
        self.route(req, res, querystring.parse(post));
    });
};

/**
 * Serve static files matching the path provided in the request.  The file
 * extension is used to determine the mime type of the response.  All files
 * are served out of the "static" folder included with Minion.  If you need
 * to serve any files whose type is not represented in the mimetypes hash
 * defined in this method, add them to the hash.
 *
 * @todo Audit to ensure files outside of "static" cannot be accessed.
 *
 * @param Request request
 * @param Response response
 */
Web.prototype.serveStatic = function (req, res) {
    var uri  = url.parse(req.url).pathname,
        file = path.join(__dirname, uri);
    
    var mimetypes = {
        css: 'text/css',
        js:  'text/javascript',
        png: 'image/png'
    };

    path.exists(file, function(exists) {
        if (exists) {
            var ext = path.extname(file).substring(1);
            res.writeHead(200, { 'Content-Type': mimetypes[ext] });
            fs.createReadStream(file).pipe(res);
        } else {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.write('File not found');
            res.end();
        }
    });
};

