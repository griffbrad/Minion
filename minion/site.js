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

var request      = require('request'),
    util         = require('util'),
    DataObject   = require('./data-object'),
    Notification = require('./notification');

var Site = function (options, minion) {
    this._contentString             = '';
    this._repeatsBeforeNotification = 5;
    this._status                    = Site.STATUS_SUCCESS;
    this._repeats                   = 6;
    this._lastError                 = null;

    DataObject.apply(this, arguments);
};

util.inherits(Site, DataObject);

module.exports = Site;

Site.STATUS_FAIL = false;

Site.STATUS_SUCCESS = true;

Site.find = function (minion, id) {
    return minion.findSiteById(id);
};

Site.prototype.getTitle = function () {
    return this.getUrl();
};

Site.prototype.getBlankTitle = function () {
    return 'Check';
};

Site.prototype.getAddMethod = function () {
    return this._minion.addSite;
};

Site.prototype.getDbCollection = function () {
    return 'sites';
};

Site.prototype.setRepeatsBeforeNotification = function (repeats) {
    this._repeatsBeforeNotification = parseInt(repeats, 10); 

    return this;
};

Site.prototype.getRepeatsBeforeNotification = function () {
    return this._repeatsBeforeNotification;
};

Site.prototype.setUrl = function (url) {
    this._url = url;

    return this;
};

Site.prototype.getUrl = function () {
    return this._url;
};

Site.prototype.setContentString = function (contentString) {
    this._contentString = contentString;

    return this;
};

Site.prototype.getContentString = function () {
    return this._contentString;
};

Site.prototype.setReason = function (reason) {
    this._reason = reason;

    return this;
};

Site.prototype.setLastError = function (lastError) {
    this._lastError = lastError;

    return this;
};

Site.prototype.setStatus = function (value) {
    this._status = value;

    return this;
};

Site.prototype.getStatus = function () {
    return this._status;
};

Site.prototype.getLastError = function () {
    return this._lastError;
};

Site.prototype.setRepeats = function (repeats) {
    this._repeats = parseInt(repeats, 10);

    return this;
};

Site.prototype.getRepeats = function () {
    return this._repeats;
};

Site.prototype.check = function () {
    var self    = this, 
        options = this.getRequestOptions();

    if (this._minion.isDebug()) {
        console.log('Checking ' + this._url);
    }

    request(options, function (error, response, body) {
        self.handleResponse.call(self, error, response, body); 
    });
};

Site.prototype.getRequestOptions = function () {
    return {
        uri: 'http://' + this._url + '/',
    }
};

Site.prototype.handleResponse = function (error, response, body) {
    if ('undefined' === typeof response) {
        if (this._minion.isDebug()) {
            console.log('No response: ' + error);
        }

        this.updateStatus(
            Site.STATUS_FAIL,
            'No response received'
        );
        return;
    }

    if (200 !== response.statusCode) {
        this.updateStatus(
            Site.STATUS_FAIL, 
            'Non-200 response status'
        );
        return;
    }
    
    if (!body) {
        if (this._minion.isDebug()) {
            console.log('Empty response body for ' + this._url);
        }

        this.updateStatus(
            Site.STATUS_FAIL, 
            'Empty response body'
        );
        return;
    }

    if (!this.responseContainsContentString(body)) {
        if (this._minion.isDebug()) {
            console.log('Found content string for ' + this._url);
        }

        this.updateStatus(
            Site.STATUS_FAIL, 
            'Reponse body did not contain specified string'
        );
        return;
    }

    this.updateStatus(Site.STATUS_SUCCESS, 'Success');
};

Site.prototype.responseContainsContentString = function (body) {
    if (null === this._contentString) {
        return true;
    }

    return -1 !== body.toUpperCase().indexOf(this._contentString.toUpperCase());
};

Site.prototype.updateStatus = function (value, reason) {
    if (this._minion.isDebug()) {
        console.log(this._url + ' status set to ' + value + ' because "' + reason + '"');
    }

    if (this._status !== value) {
        if (Site.STATUS_FAIL === this._status
            && this._repeats < this._repeatsBeforeNotification
        ) {
            this._repeats = this._repeatsBeforeNotification;

            if (this._minion.isDebug()) {
                console.log('Skipping notification.  Flapping.');
            }
        } else {
            this._repeats = 0;
        }
    }

    if (Site.STATUS_FAIL === value) {
        this._lastError = new Date();
    }

    this._status   = value;
    this._repeats += 1;
    this._reason   = reason;

    if (this._repeatsBeforeNotification === this._repeats) {
        this.sendNotifications();
    }

    this.syncDb();

    return this;
};

Site.prototype.sendNotifications = function () {
    if (this._minion.isDebug()) {
        console.log('Sending notifications for ' + this._url);
        return;
    }

    var notification = new Notification(this._minion),
        subject      = '',
        body         = '';

    subject = this._url + ' (' + this._reason + ')';
    
    if (!this._status) {
        subject = 'FAILED: ' + subject;
    } else {
        subject = 'RECOVERED: ' + subject;
    }

    body = subject;

    notification.setBody(body)
                .setSubject(subject)
                .send();
};

Site.prototype.syncDb = function () {
    var self = this;

    this._minion.getDb().collection('sites', function(err, collection) {
        collection.update(
            { url: self._url },
            {
                $set: {
                    repeats: self._repeats,
                    repeatsBeforeNotification: self._repeatsBeforeNotification,
                    status: self._status,
                    reason: self._reason,
                    lastError: self._lastError,
                    contentString: self._contentString
                }
            },
            { safe: true },
            function (err, result) {
            }
        );
    });

    this._minion.getDb().collection('log', function(err, collection) {
        collection.insert({
            url: self._url,
            siteId: self._id,
            repeats: self._repeats,
            status: self._status,
            reason: self._reason,
            dateChecked: new Date()
        });
    });
};
