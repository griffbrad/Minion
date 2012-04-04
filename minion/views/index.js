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
    Handlebars = require('handlebars'),
    util       = require('util'),
    Index;

/**
 * Implements a simple dashboard that displays the latest status for all checks.
 */
Index = function(minion, request, response) {
    this._minion   = minion;
    this._response = response;
    this._request  = request;
};

util.inherits(Index, View);

module.exports = Index;

Index.prototype.getTemplateName = function () {
    return 'index';
};

/**
 * Get sites from Minion and sort them alphabetically.
 */
Index.prototype.getTemplateData = function () {
    var sites = [];

    this._minion.getSites().forEach(function (site) {
        sites.push({
            url:       site.getUrl(),
            id:        site.getId(),
            status:    site.getStatus(),
            repeats:   site.getRepeats(),
            lastError: site.getLastError()
        });
    }, this);

    sites.sort(function (a, b) {
        if (a.url < b.url) {
            return -1;
        } else {
            return 1;
        }
    });

    this.registerHelper('status', this.renderStatus);
    this.registerHelper('lastError', this.renderLastError);
    
    return {
        sites: sites    
    };
};

Index.prototype.renderStatus = function (site) {
    if (site.status) {
        return new Handlebars.SafeString(
            '<span class="all_clear">No errors</span>'
        );
    } else {
        var suffix = 's';

        if (1 === site.repeats) {
            suffix = '';
        }

        return new Handlebars.SafeString(
            '<span class="error">Failed ' + site.repeats + ' Time' + suffix + '</span>'
        );
    }
};

Index.prototype.renderLastError = function (site) {
    if (site.lastError) {
        return site.lastError;
    } else {
        return new Handlebars.SafeString(
            '<span class="all_clear">No errors</span>'
        );
    }
};

