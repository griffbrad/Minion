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

