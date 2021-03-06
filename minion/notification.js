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

var https        = require('https'),
    querystring  = require('querystring'),
    TwilioClient = require('twilio').Client,
    Twiml        = require('twilio').Twiml,
    util         = require('util');

/**
 * The object manages the sending and logging of event notifications.  Currently,
 * only messages transported over SendGrid's Web API are managed.  In the near
 * future, we plan to add support for email notifications over SMTP and IP
 * telephony notifications (i.e. SMS and phone calls) via Twilio's APIs.
 *
 * @param Minion minion
 * @param Site site
 */
var Notification = function (minion, site) {
    this._minion     = minion;
    this._recipients = minion.getContacts(site.getContacts());
};

module.exports = Notification;

/**
 * Set the subject to use for messages.
 *
 * @param String subject
 * @return Notification
 */
Notification.prototype.setSubject = function (subject) {
    this._subject = subject;

    return this;
};

/**
 * Set the body to use for messages.
 *
 * @param String body
 * @return Notification
 */
Notification.prototype.setBody = function (body) {
    this._body = body;

    return this;
};

/**
 * Send notifications to all recipients.  When Minion is in debug mode, messages
 * will not actually be sent, but a line will be written to the console for each
 * of the recipients who would have otherwise received notifications.
 *
 * @return Notification
 */
Notification.prototype.send = function () {
    // Send emails
    this._recipients.forEach(function (recipient) {
        if (this._minion.isDebug()) {
            console.log('Sending notification to ' + recipient.getEmailAddress());
            return;
        }

        this.sendToRecipient(recipient);
    }, this);

    // Make calls
    var calls = [];

    this._recipients.forEach(function (recipient) {
        if (recipient.getAllowCalls()) {
            if (this._minion.isDebug()) {
                console.log('Calling ' + recipient.getPhoneNumber());
            }
            
            calls.push(recipient);
        }
    }, this);

    this.makeCalls(calls);

    return this;
};

Notification.TwilioClient = null;

Notification.prototype.makeCalls = function (calls) {
    var config    = this._minion.getConfig().twilio,
        self      = this;

    if (null === Notification.TwilioClient) {
        Notification.TwilioClient = new TwilioClient(
            config.accountSid,
            config.authToken,
            this._minion.getNode().hostname
        );
    }

    var phone = Notification.TwilioClient.getPhoneNumber(config.phoneNumber);

    phone.setup(function () {
        calls.forEach(function (recipient) {
            phone.makeCall(
                '+1' + recipient.getPhoneNumber(),
                null,
                function (call) {
                    call.on(
                        'answered',
                        function (params, response) {
                            response.append(new Twiml.Say('This is your website monitoring system.'));
                            response.append(new Twiml.Say('Please listen to this important status update:'));
                            response.append(new Twiml.Say(self._subject));
                            response.append(new Twiml.Say('Good bye'));
                            response.append(new Twiml.Hangup());
                            response.send();
                           
                            self.log(
                                'Phone Call',
                                recipient.getTitle() + ' (' + recipient.getPhoneNumber() + ')', 
                                self._subject, 
                                true
                            );
                        }
                    );
                }
            );
        });
    });
};

/**
 * Send a notification to an individual recipient, specified in the first 
 * parameter.  The SendGrid Web API is used to transport the messages.  You
 * can configure the API credentials for your SendGrid account in the Minion
 * configuration file.  The response status is logged to allow tracking of
 * problems encountered while sending notifications, but we don't currently
 * retrieve the full response body to get the reason a notification could
 * not be sent.
 *
 * @todo From address should come from configuration file.
 * @todo Recipient name should be included in message.
 * @todo Reason for message failing to send should be captured and logged.
 *
 * @param String recipient
 */
Notification.prototype.sendToRecipient = function (recipient) {
    var self = this;

    var postData = {
        api_user: this._minion.getConfig().sendGrid.apiUser,
        api_key:  this._minion.getConfig().sendGrid.apiKey,
        subject:  this._subject,
        text:     this._body,
        from:     'minion@deltasys.com',
        to:       recipient.getEmailAddress()
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
        var status = true;

        if (200 !== response.statusCode) {
            status = false; 
        }

        self.log(
            'Email', 
            recipient.getTitle() + ' <' + recipient.getEmailAddress() + '>', 
            self._subject, 
            status
        );
    });

    postReq.write(postData);
    postReq.end();
};

/**
 * Log the results of the sendToRecipient() method to aid in troubleshooting
 * sending errors.  The contents of this log are displayed in the web frontend.
 *
 * @todo Log ContactID so we can display logs per contact in the web frontend.
 *
 * @param String recipient
 * @param String subject
 * @param boolean status
 */
Notification.prototype.log = function (type, recipient, subject, status) {
    var self = this;

    this._minion.getDb().collection('notifications', function (err, collection) {
        collection.insert({
            dateSent:  new Date(),
            status:    status,
            type:      type,
            subject:   subject,
            recipient: recipient,
            location:  self._minion.getNode().title
        });
    });
};
