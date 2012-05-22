(function () {
    'use strict';

    window.MINION = {};

    var YD = YAHOO.util.Dom,
        YE = YAHOO.util.Event;

    MINION.Log = function (checkId) {
        this._onlyFailures = YD.get('onlyFailures');
        this._logBody      = YD.get('logBody');
        this._checkId      = checkId;
        this._xhrLock      = false;
        this._loading      = YD.get('loading');

        // We start on page 2 because the initial data is rendered server-side
        this._page = 2;
    };

    MINION.Log.prototype.init = function () {
        YE.on(
            this._onlyFailures, 
            'click', 
            this._handleOnlyFailuresClick,
            this,
            true
        );
        
        YE.on(
            window, 
            'scroll', 
            this._checkScroll, 
            this, 
            true
        );
    };

    MINION.Log.prototype.load = function () {
        this._xhrLock = true;

        this._loading.style.display = 'block';

        YAHOO.util.Connect.asyncRequest(
            'GET',
            this._assembleDataUrl(),
            {
                scope: this,
                success: function (o) {
                    this._logBody.innerHTML += o.responseText;

                    this._page   += 1
                    this._xhrLock = false;
        
                    this._loading.style.display = 'none';
                }
            }
        );
    };

    MINION.Log.prototype._handleOnlyFailuresClick = function (e) {
        var url = '/log?id=' + this._checkId + '&onlyFailures=';

        if (this._onlyFailures.checked) {
            url += '1';
        } else {
            url += '0';
        }

        window.location = url;
    };
    
    MINION.Log.prototype._checkScroll = function (e) {
        var scroll = document.body.scrollTop + document.body.clientHeight + 50,
            limit  = document.body.scrollHeight;

        if (!this._xhrLock && scroll > limit) {
            this.load();
        }
    };

    MINION.Log.prototype._assembleDataUrl = function () {
        var url = '/log?id=' + this._checkId + '&onlyFailures=';

        if (this._onlyFailures.checked) {
            url += '1';
        } else {
            url += '0';
        }

        url += '&data=1';
        url += '&page=' + this._page;

        return url;
    };
}());
