if ('undefined' == typeof MINION) {
    var MINION = {};
}

if ('undefined' == typeof MINION.widget) {
    MINION.widget = {};
}

(function(MINION, YD, YE, YA) {
    var _helpNodes = [];

    MINION.widget.Help = function() 
    {
        this._node = document.createElement('div');
        YD.addClass(this._node, 'minion-help');
        _helpNodes.push(this._node);

        this._header = null;
        this._body   = null;
    };

    MINION.widget.Help.prototype.setHeader = function(header)
    {
        this._header = header;

        return this;
    };
    
    MINION.widget.Help.prototype.setBody = function(body)
    {
        this._body = body;

        return this;
    };

    MINION.widget.Help.prototype.render = function()
    {
        var closeButton = document.createElement('a');
        YD.addClass(closeButton, 'minion-close');
        this._node.appendChild(closeButton);

        YE.on(closeButton, 'click', function(e) {
            var anim = new YA(
                this._node,
                {
                    'opacity': { from: 100, to: 0 },
                    'top'    : { from: 0, to: -400 }
                },
                .25,
                YAHOO.util.Easing.easeOut
            );

            var that = this;

            anim.onComplete.subscribe(function() {
                that._node.style.display = 'none';
            });

            anim.animate();
        }, this, true);

        var headerNode = document.createElement('h2');
        headerNode.innerHTML = this._header;
        this._node.appendChild(headerNode);

        var bodyNode = document.createElement('div');
        bodyNode.innerHTML = this._body;
        this._node.appendChild(bodyNode);

        for (var i = 0; i < _helpNodes.length; i++) {
            if (_helpNodes[i] !== this._node) {
                _helpNodes[i].style.display = 'none';
            }
        }

        document.body.appendChild(this._node);

        var anim = new YA(
            this._node,
            {
                'opacity': { from: 0, to: 100 },
                'top'    : { from: -400, to: 0 }
            },
            .25,
            YAHOO.util.Easing.easeOut
        );

        this._node.style.display = 'block';

        anim.animate();
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event,
    YAHOO.util.Anim
);
