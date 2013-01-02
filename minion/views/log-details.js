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
    ObjectID   = require('mongodb').ObjectID,
    LogDetails;

/**
 * Displays details for a single log message.
 */
LogDetails = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(LogDetails, View);

module.exports = LogDetails;

LogDetails.prototype.init = function () {
    var id   = this.getQuery('id'),
        self = this;

    this._minion.getDb().collection('log', function (err, collection) {
        collection
            .findOne({_id: new ObjectID(id)}, function (err, data) {
                self._data = data;
                self.initComplete();
            });
    });
};

LogDetails.prototype.getTemplateName = function () {
    return 'log-details';
};

LogDetails.prototype.getTemplateData = function () {
    this.registerHelper('logDetailFields', this.renderFields)
        .registerHelper('logDetails', this.renderDetails);

    return this._data; 
};

LogDetails.prototype.renderFields = function () {
    var fields, detailKey, detail, out = '';
        
    fields = [
        {
            title: 'Date Checked',
            value: this._data.dateChecked
        },
        {
            title: 'Status',
            value: this.renderStatus(this._data)
        }
    ];

    if (this._data.details) {
        for (detailKey in this._data.details) {
            if (this._data.details.hasOwnProperty(detailKey)) {
                detail = this._data.details[detailKey];

                if ('field' === detail.format) {
                    fields.push({
                        title: detail.title,
                        value: detail.data
                    });
                }
            }
        }
    }

    fields.forEach(function (field) {
        out += '<tr>';
        out += '<th scope="row">' + field.title + ':</th>';
        out += '<td>' + field.value + '</td>';
        out += '</tr>';
    }, this);

    return new Handlebars.SafeString(out);
};

LogDetails.prototype.renderStatus = function (result) {
    var id;

    if (result.status) {
        return (
            '<span class="all_clear">No Errors</span>'
        );
    } else {
        id = String(result._id);

        return (
            '<a href="/log-details?id=' + id + '" class="error">' + result.reason + '</a>'
        );
    }
};

LogDetails.prototype.renderDetails = function () {
    var out = '', detailKey, detail;
    
    if (!this._data.details) {
        out = '<div class="none">No details available</div>';
    } else {
        for (detailKey in this._data.details) {
            if (this._data.details.hasOwnProperty(detailKey)) {
                detail = this._data.details[detailKey];

                if ('field' !== detail.format) {
                    out += '<h3>' + detail.title + '</h3>';

                    if ('html' === detail.format) {
                        out += this._renderHtmlDetail(detail.data); 
                    } else if ('grid' === detail.format) {
                        out += this._renderGridDetail(detail.data);
                    }
                }
            }
        }
    }

    return new Handlebars.SafeString(out);
};

LogDetails.prototype._renderGridDetail = function (data) {
    var out = '', 
        key, 
        value;

    out += '<table class="log-detail-fields">';

    for (key in data) {
        if (data.hasOwnProperty(key)) {
            value = data[key];

            out += '<tr>';
            out += '<th scope="row">' + key + ':</th>';
            out += '<td>' + this._escapeHtml(value) + '</td>';
            out += '</tr>';
        }
    }

    out += '</table>';

    return out;
};

LogDetails.prototype._renderHtmlDetail = function (html) {
    return '<code><pre>' + this._escapeHtml(html) + '</pre></code>';
};

LogDetails.prototype._escapeHtml = function (unsafe) {
      return unsafe
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
};
