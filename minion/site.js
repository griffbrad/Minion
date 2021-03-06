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
    Notification = require('./notification'),
    ObjectID     = require('mongodb').ObjectID;

/**
 * A DataObject to manage a website.  Currently, the Site object also contains
 * the code for performing HTTP checks, though that functionality will be 
 * refactored into an independent object as more checks are added to Minion.
 *
 * @param Object options
 * @param Minion minion
 */
var Site = function (options, minion) {
    this._contentString             = '';
    this._repeatsBeforeNotification = 5;
    this._responseTime              = null;
    this._status                    = Site.STATUS_SUCCESS;
    this._repeats                   = 6;
    this._interval                  = 60000; // 60 Seconds
    this._contacts                  = [];
    this._lastError                 = null;

    this._performanceIntervals = [
        100,
        250,
        500,
        1000,
        2000,
        3000,
        5000,
        7000,
        10000
    ];

    DataObject.apply(this, arguments);
};

util.inherits(Site, DataObject);

module.exports = Site;

/**
 * Status constant for when a check fails.  Using a boolean directly can cause
 * confusion in some situations, so it is preferable to use this more clearly
 * labelled constants.
 *
 * @const
 */
Site.STATUS_FAIL = false;

/**
 * Status constant for when a check succeeds.  Using a boolean directly can cause
 * confusion in some situations, so it is preferable to use this more clearly
 * labelled constants.
 *
 * @const
 */
Site.STATUS_SUCCESS = true;

/**
 * Search Minion's array of sites for one matching the supply ObjectID.
 *
 * @param Minion minion
 * @param String id
 * @return Site
 */
Site.find = function (minion, id) {
    return minion.findSiteById(id);
};

/**
 * @return String
 */
Site.prototype.getTitle = function () {
    return this.getUrl();
};

/**
 * @return String
 */
Site.prototype.getBlankTitle = function () {
    return 'Check';
};

/**
 * @return Function
 */
Site.prototype.getAddMethod = function () {
    return this._minion.addSite;
};

/**
 * @return String
 */
Site.prototype.getDbCollection = function () {
    return 'sites';
};

/**
 * Get an array of valid intervals of time between checks.  Values other than
 * these will not be allowed.  Any value that doesn't fall in this valid
 * group will be converted to the "1 Minute" interval instead.
 *
 * @return Array
 */
Site.prototype.getValidIntervals = function () {
    return [
        {
            value: 60000, 
            title: '1 Minute'
        },
        {
            value: 300000, 
            title: '5 Minutes'
        },
        {
            value: 600000,
            title: '10 Minutes'
        }, 
        {
            value: 900000,
            title: '15 Minutes'
        },
        {
            value: 1800000,
            title: '30 Minutes'
        }, 
        {
            value: 3600000,
            title: '60 Minutes'
        }
    ];
}

/**
 * Set the interval of time between performing checks.  The interval is stored
 * as a number of milliseconds.  Only the values included in the array returned
 * by getValidIntervals() are allowed.
 *
 * @param integer value
 * @return Site
 */
Site.prototype.setInterval = function (value) {
    var match = false;

    value = parseInt(value);

    this.getValidIntervals().forEach(function (interval) {
        if (interval.value === value) {
            match = true;
        }
    });

    if (!match) {
        value = 60000;
    }

    this._interval = value;

    return this;
};

/**
 * Get the interval (in milliseconds) of time between performing checks.
 *
 * @return integer
 */
Site.prototype.getInterval = function () {
    return this._interval;
};

/**
 * @param integer repeats
 * @return Site
 */
Site.prototype.setRepeatsBeforeNotification = function (repeats) {
    this._repeatsBeforeNotification = parseInt(repeats, 10); 

    return this;
};

/**
 * @return integer
 */
Site.prototype.getRepeatsBeforeNotification = function () {
    return this._repeatsBeforeNotification;
};

/**
 * @param integer responseTime
 * @return Site
 */
Site.prototype.setResponseTime = function (responseTime) {
    this._responseTime = responseTime;

    return this;
};

/**
 * @return integer
 */
Site.prototype.getResponseTime = function () {
    return this._responseTime;
};

/**
 * @param String url
 * @return Site
 */
Site.prototype.setUrl = function (url) {
    this._url = url;

    return this;
};

/**
 * @return String
 */
Site.prototype.getUrl = function () {
    return this._url;
};

/**
 * @param String contentString
 * @return Site
 */
Site.prototype.setContentString = function (contentString) {
    this._contentString = contentString;

    return this;
};

/**
 * @return String
 */
Site.prototype.getContentString = function () {
    return this._contentString;
};

/**
 * @param String reason
 * @return Site
 */
Site.prototype.setReason = function (reason) {
    this._reason = reason;

    return this;
};

/**
 * @param Date lastError
 * @return Site
 */
Site.prototype.setLastError = function (lastError) {
    this._lastError = lastError;

    return this;
};

/**
 * @return Date
 */
Site.prototype.getLastError = function () {
    return this._lastError;
};

/**
 * @param boolean value
 * @return Site
 */
Site.prototype.setStatus = function (value) {
    this._status = value;

    return this;
};

/**
 * @return boolean
 */
Site.prototype.getStatus = function () {
    return this._status;
};

/**
 * @param integer repeats
 * @return Site
 */
Site.prototype.setRepeats = function (repeats) {
    this._repeats = parseInt(repeats, 10);

    return this;
};

/**
 * @return integer
 */
Site.prototype.getRepeats = function () {
    return this._repeats;
};

/**
 * Set the contacts associated with this site.  Should be an array
 * of Contact ObjectIDs associated with Minion.
 *
 * @param Array contacts
 * @return Site
 */
Site.prototype.setContacts = function (contacts) {
    contacts = contacts || [];

    if (!util.isArray(contacts)) {
        contacts = [contacts];
    }

    this._contacts = contacts;

    return this;
};

/**
 * @return Array
 */
Site.prototype.getContacts = function () {
    return this._contacts;
};

/**
 * Perform HTTP check for this site.  This method will also call setTimeout()
 * to schedule the next check, after the amount of time specified in this
 * object's "interval" property has passed.
 */
Site.prototype.check = function () {
    var self      = this, 
        options   = this.getRequestOptions(),
        startTime = (new Date).getTime();

    if (this._minion.isDebug()) {
        console.log('Checking ' + this._url);
    }

    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        }

        var responseTime = (new Date).getTime() - startTime;

        self.handleResponse(error, response, body, responseTime); 
    });

    setTimeout(
        function () {
            self.check();
        },
        this._interval
    );
};

/**
 * Get the options to pass to the request module when performing an HTTP check.
 *
 * @return Object
 */
Site.prototype.getRequestOptions = function () {
    var url = this._url + '/';
    
    return {
        uri:     'http://' + url,
        timeout: 18000,
        jar:     false
    };
};

/**
 * Handle the HTTP response created by performing the HTTP status check.  This
 * method will examine the response and set the Site's status accordingly.
 *
 * @param Object error
 * @param Response response
 * @param String body
 * @param integer responseTime
 */
Site.prototype.handleResponse = function (error, response, body, responseTime) {
    var details = null;

    if ('undefined' === typeof response) {
        if (this._minion.isDebug()) {
            console.log('No response: ' + error);
        }

        this.updateStatus(
            Site.STATUS_FAIL,
            'No response received',
            responseTime
        );
        return;
    }

    details = {
        status: {
            title:  'Response Status',
            data:   response.statusCode,
            format: 'field'
        },
        headers: {
            title:  'Headers',
            data:   response.headers,
            format: 'grid'
        },
        body: { 
            title: 'Body',
            data:   body,
            format: 'html'
        }
    };

    if (200 !== response.statusCode) {
        console.log(response);

        this.updateStatus(
            Site.STATUS_FAIL, 
            response.statusCode + ' response status',
            responseTime,
            details        
        );
        return;
    }
  
    if (!body) {
        if (this._minion.isDebug()) {
            console.log('Empty response body for ' + this._url);
        }

        this.updateStatus(
            Site.STATUS_FAIL, 
            'Empty response body',
            responseTime,
            details
        );
        return;
    }

    if (!this.responseContainsContentString(body)) {
        if (this._minion.isDebug()) {
            console.log('Found content string for ' + this._url);
        }

        this.updateStatus(
            Site.STATUS_FAIL, 
            'Reponse body did not contain specified string',
            responseTime,
            details        
        );
        return;
    }

    this.updateStatus(Site.STATUS_SUCCESS, 'Success', responseTime);
};

/**
 * Check for this object's "contentString" property in the reponse body.
 *
 * @param String body
 * @return boolean
 */
Site.prototype.responseContainsContentString = function (body) {
    if (this._contentString) {
        return true;
    }

    return -1 !== body.toUpperCase().indexOf(this._contentString.toUpperCase());
};

/**
 * Update this Site's status after examining the HTTP response.  If the status
 * has repeated the number of times specified by the "repeatsBeforeNotification"
 * property, this method will also trigger the sending of notifications to the 
 * Site's contacts.
 *
 * @param boolean value
 * @param String reason
 * @param integer responseTime
 * @return Site
 */
Site.prototype.updateStatus = function (value, reason, responseTime, details) {
    var self = this;

    this._minion.getDb().collection('sites', function(err, collection) {
        collection.findOne({_id: new ObjectID(self.getId())}, function (err, data) {
            self._updateStatusInternal(data, value, reason, responseTime, details);
        });
    });

    return this;
};

Site.prototype._updateStatusInternal = function (data, value, reason, responseTime, details) {
    this._status                    = data.status;
    this._repeats                   = data.repeats;
    this._repeatsBeforeNotification = data.repeatsBeforeNotification;
    this._lastError                 = data.lastError;
    this._contentString             = data.contentString;

    var threshold = parseInt(this._repeatsBeforeNotification, 10);

    if (this._minion.isDebug()) {
        console.log(this._url + ' status set to ' + value + ' because "' + reason + '"');
    }

    if (this._status !== value) {
        if (Site.STATUS_FAIL === this._status
            && this._repeats < threshold
        ) {
            this._repeats = threshold;

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

    this._status       = value;
    this._repeats     += 1;
    this._reason       = reason;
    this._responseTime = responseTime;

    if (threshold === this._repeats) {
        this.sendNotifications();
    }

    this.syncDb(details);
};

/**
 * Send notifications to all the contacts assigned to this Site.
 */
Site.prototype.sendNotifications = function () {
    if (this._minion.isDebug()) {
        console.log('Sending notifications for ' + this._url);
        return;
    }

    var notification = new Notification(this._minion, this),
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

/**
 * Sync this Site's property with MongoDB.  Also, this method will log the 
 * results of the most recent check.
 */
Site.prototype.syncDb = function (details) {
    var self = this,
        date = new Date(),
        intervalKey,
        i,
        interval,
        incrementFields = {};

    this._minion.getDb().collection('sites', function(err, collection) {
        collection.update(
            { url: self._url },
            {
                $set: {
                    repeats:                   self._repeats,
                    repeatsBeforeNotification: self._repeatsBeforeNotification,
                    status:                    self._status,
                    responseTime:              self._responseTime,
                    reason:                    self._reason,
                    lastError:                 self._lastError,
                    contentString:             self._contentString
                }
            },
            { safe: true },
            function (err, result) {
            }
        );
    });

    this._minion.getDb().collection('log', function(err, collection) {
        collection.insert({
            url:          self._url,
            siteId:       self._id,
            repeats:      self._repeats,
            responseTime: self._responseTime,
            status:       self._status,
            location:     self._minion.getNode().title,
            reason:       self._reason,
            details:      details,
            dateChecked:  date
        });
    });

    if (this._status) {
        date.setMinutes(0);
        date.setHours(0);
        date.setSeconds(0);
        date.setMilliseconds(0);

        intervalKey = null;

        for (i = 0; i < this._performanceIntervals.length; i++) {
            interval = this._performanceIntervals[i];

            if (this._responseTime <= interval) {
                intervalKey = String(interval);
                break;
            }
        }

        if (intervalKey) {
            intervalKey = 'intervals.' + intervalKey;
        } else {
            intervalKey = 'intervals.' + this._performanceIntervals.pop();
        }

        incrementFields[intervalKey]  = 1;
        incrementFields['checkCount'] = 1;
        incrementFields['totalMs']    = this._responseTime;

        this._minion.getDb().collection('performance', function (err, collection) {
            collection
                .update(
                    {
                        siteId: self._id,
                        date:   date
                    },
                    {
                        $inc: incrementFields
                    },
                    {
                        upsert: true
                    }
                );
        });
    }
};
