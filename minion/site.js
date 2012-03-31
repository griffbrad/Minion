var request      = require('request'),
    Notification = require('./notification');

var Site = function (options, minion) {
    this._contentString             = null;
    this._repeatsBeforeNotification = 5;
    this._status                    = Site.STATUS_SUCCESS;
    this._repeats                   = 6;
    this._minion                    = minion;
    this._lastError                 = null;

    this.setOptions(options);
};

module.exports = Site;

Site.STATUS_FAIL = false;

Site.STATUS_SUCCESS = true;

Site.prototype.setOptions = function (options) {
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            this.setOption(key, options[key]);
        }
    }
};
    
Site.prototype.setOption = function (option, value) {
    var method = 'set' + option.charAt(0).toUpperCase() + option.substr(1);

    if (!this[method]) {
        if (this._minion.isDebug()) {
            console.log('Calling undefined setter: ' + method);
        }
        return;
    }

    this[method].call(this, value);
};

Site.prototype.setRepeatsBeforeNotification = function (repeats) {
    this._repeatsBeforeNotification = repeats; 

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
    this._repeats = repeats;

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
};
