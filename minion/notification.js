var https       = require('https'),
    querystring = require('querystring');

var Notification = function (minion) {
    this._minion     = minion;
    this._recipients = minion.getConfig().recipients;
};

module.exports = Notification;

Notification.prototype.setSubject = function (subject) {
    this._subject = subject;

    return this;
};

Notification.prototype.setBody = function (body) {
    this._body = body;

    return this;
};

Notification.prototype.send = function () {
    this._recipients.forEach(function(recipient) {
        if (this._minion.isDebug()) {
            console.log('Sending notification to ' + recipient);
            return;
        }

        this.sendToRecipient(recipient);
    }, this);
};

Notification.prototype.sendToRecipient = function (recipient) {
    var postData = {
        api_user: this._minion.getConfig().sendGrid.apiUser,
        api_key:  this._minion.getConfig().sendGrid.apiKey,
        subject:  this._subject,
        text:     this._body,
        from:     'minion@deltasys.com',
        to:       recipient
    };

    postData = querystring.stringify(postData);

    var options = {
        host: 'sendgrid.com',
        path: '/api/mail.send.json',
        method: 'POST',
        port: 443,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };

    var postReq = https.request(options, function (response) {
        if (200 !== response.statusCode) {
            console.log('Failed to send email notification.');
        }
    });

    postReq.write(postData);
    postReq.end();
};

