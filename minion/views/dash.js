var View = require('./abstract'),
    util = require('util'),
    Dash;

Dash = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(Dash, View);

module.exports = Dash;

Dash.prototype.init = function () {
    var date = new Date(Date.parse(this.getQuery('date')));

    this.findCheckStats(date);
};

Dash.prototype.findCheckStats = function (date) {
    var self = this;
    
    this._minion.getDb().collection('sites', function (err, collection) {
        collection
            .find()
            .toArray(function (err, items) {
                self._checkCount = items.length;
                self._errors     = [];

                for (var i = 0; i < items.length; i++) {
                    var item = items[i];

                    if (!item.status) {
                        self._errors.push(item.url + ': ' + item.reason);
                    }
                }

                self.findDailyNotificationStats(date);
            });
    });
};

Dash.prototype.findDailyNotificationStats = function (date) {
    var self = this,
        daily = new Date(date.getTime()),
        next  = new Date(daily.getTime());

    next.setDate(daily.getDate() + 1);

    this._minion.getDb().collection('notifications', function (err, collection) {
        collection
            .find({
                dateSent: {
                    '$gte': daily,
                    '$lt':  next
                }
            })
            .toArray(function (err, items) {
                self._dailyNotificationCount = items.length;
                self.findMonthlyNotificationStats(date);
            });
    });
};

Dash.prototype.findMonthlyNotificationStats = function (date) {
    var self  = this,
        month = new Date(date.getTime()),
        next;
   
    month.setDate(0);
    
    next = new Date(month.getTime());
    next.setMonth(month.getMonth() + 1);
    next.setDate(0);

    this._minion.getDb().collection('notifications', function (err, collection) {
        collection
            .find({
                dateSent: {
                    '$gte': month,
                    '$lt':  next
                }
            })
            .toArray(function (err, items) {
                self._monthlyNotificationCount = items.length;

                self.initComplete();
            });
    });
};

Dash.prototype.get = function () {

    var data = {
        title: 'Minion',
        stats: [
            {
                type:   'basic',
                title:  'Current Errors',
                value:  this._errors,
                format: 'text'
            },
            {
                type:   'daily',
                title:  'Checks',
                value:  this._checkCount,
                format: 'integer'
            },
            {
                type:   'daily',
                title:  'Notifications',
                value:  this._dailyNotificationCount,
                format: 'integer'
            },
            {
                type:   'monthly',
                title:  'Checks',
                value:  this._checkCount,
                format: 'integer'
            },
            {
                type:   'monthly',
                title:  'Notifications',
                value:  this._monthlyNotificationCount,
                format: 'integer'
            }
        ]
    };

    this._response.write(JSON.stringify(data));
    this._response.end();
};
