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
    Log;

Log = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(Log, View);

module.exports = Log;

Log.prototype.init = function () {
    var id             = this.getQuery('id'),
        onlyFailures   = this.getQuery('onlyFailures'),
        dataOnly       = this.getQuery('data'),
        page           = parseInt(this.getQuery('page'), 10),
        filterCriteria = {},
        sortCriteria   = {$natural: -1},
        self           = this;

    if (id) {
        this._site = this._minion.findSiteById(id);
    }

    if (page <= 0) {
        page = 1;
    }

    if (parseInt(onlyFailures, 10)) {
        this._onlyFailures = true;
    } else {
        this._onlyFailures = false;
    }

    if (!parseInt(dataOnly, 10)) {
        this._dataOnly     = false;
        this._renderLayout = true;
    } else {
        this._dataOnly     = true;
        this._renderLayout = false;
    }

    if (!this._site) {
        this.redirect('/');
    }

    filterCriteria.siteId = this._site.getId();

    if (this._onlyFailures) {
        filterCriteria.status = false;
        sortCriteria = {dateChecked: -1};
    }

    this._minion.getDb().collection('log', function (err, collection) {
        collection
            .find(filterCriteria)
            .limit(200)
            .skip((page - 1) * 200)
            .sort(sortCriteria)
            .toArray(function (err, items) {
                self._entries = items;
                self.initComplete();
            });
    });
};

Log.prototype.getTemplateName = function () {
    if (this._dataOnly) {
        return 'log-body';
    } else {
        return 'log';
    }
};

Log.prototype.getTemplateData = function () {
    this.registerHelper('status', this.renderStatus)
        .registerHelper('onlyFailures', this.renderOnlyFailuresCheckbox)
        .registerHelper('responseTime', this.renderResponseTime);

    return {
        entries: this._entries,
        url:     this._site.getUrl(),
        id:      this._site.getId()
    };
};

Log.prototype.renderStatus = function (result) {
    var id;

    if (result.status) {
        return new Handlebars.SafeString(
            '<span class="all_clear">No Errors</span>'
        );
    } else {
        id = String(result._id);

        return new Handlebars.SafeString(
            '<a href="/log-details?id=' + id + '" class="error">' + result.reason + '</a>'
        );
    }
};

Log.prototype.renderOnlyFailuresCheckbox = function () {
    var out = '<input type="checkbox" name="onlyFailures" id="onlyFailures" value="1" ';

    if (this._onlyFailures) {
        out += 'checked="checked"';
    }

    out += ' />';

    return new Handlebars.SafeString(out);
};

Log.prototype.renderResponseTime = function (responseTime) {
    if (responseTime) {
        return responseTime + 'ms';
    } else {
        return new Handlebars.SafeString(
            '<span class="all_clear">Not Available</span>'
        );
    }
};
