if ('undefined' == typeof MINION) {
    var MINION = {};
}

if ('undefined' == typeof MINION.widget) {
    MINION.widget = {};
}

(function(MINION, YD, YE, YA) {
    MINION.widget.Message = function(message) 
    {
        this._node = document.createElement('div');
        YD.addClass(this._node, 'minion-message');
        this._node.innerHTML = message;

        document.body.appendChild(this._node);
    };

    MINION.widget.Message.prototype.setText = function(text)
    {
        var that = this;

        setTimeout(function() {
            that._node.innerHTML = text;
        }, 100);

        return this;
    };

    MINION.widget.Message.prototype.clearAfterDelay = function(delay)
    {
        var that = this;

        if (! delay) {
            delay = 1000;
        }

        setTimeout(function() {
            var anim = new YA(
                that._node,
                {
                    'opacity': { to: 0 },
                    'top'    : { to: -200 }
                },
                1,
                YAHOO.util.Easing.easeOut
            );

            anim.onComplete.subscribe(function() {
                document.body.removeChild(that._node); 
            });

            anim.animate();
        }, delay);
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event,
    YAHOO.util.Anim
);
