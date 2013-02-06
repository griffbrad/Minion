var View = require('./abstract'),
    util = require('util'),
    Dash;

Dash = function (minion, request, response) {
    View.apply(this, arguments);
};

util.inherits(Dash, View);

module.exports = Dash;

Dash.prototype.init = function () {
    var date = this.getQuery('date'),
        self = this;

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
            }
        ]
    };

    this._response.write(JSON.stringify(data));
    this._response.end();
};
