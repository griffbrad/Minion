if ('undefined' == typeof MINION) {
    var MINION = {};
}

if ('undefined' == typeof MINION.widget) {
    MINION.widget = {};
}

(function(MINION) {
    MINION.widget.Timer = function(seconds, size, callback, callbackContext) {
        this._canvas = document.createElement('canvas');

        this._canvas.width  = size;
        this._canvas.height = size;

        this._context = this._canvas.getContext('2d');
        this.setFill(.5, 1);

        this._seconds   = seconds;
        this._size      = size;
        this._half      = size / 2;
        this._stopPulse = false;

        this._callback        = callback;
        this._callbackContext = callbackContext;
    };

    MINION.widget.Timer.prototype.getCanvas = function()
    {
        return this._canvas;
    };

    MINION.widget.Timer.prototype.runCallback = function()
    {
        this._callback.call(this._callbackContext);
    };

    MINION.widget.Timer.prototype.clear = function()
    {
        this._context.clearRect(0, 0, this._size, this._size);

        return this;
    };

    MINION.widget.Timer.prototype.setFill = function(grayPercent, opacity)
    {
        var colorValue = Math.round(grayPercent * 255),
            rgba       = 'rgba(';

        if (opacity < 0) {
            opacity = 0;
        }

        rgba += colorValue + ', ';
        rgba += colorValue + ', ';
        rgba += colorValue + ', ';
        rgba += opacity + ')';

        this._context.fillStyle = rgba;

        return this;
    };

    MINION.widget.Timer.prototype.drawCircle = function(angle, radius)
    {
        if (! radius) {
            radius = this._half;
        }

        angle = angle - 90;

        this.clear();

        // Draw background circle
        if (angle < 270) {
            this._drawBackgroundCircle(angle, radius);
        }

        this._context.beginPath();
        this._context.moveTo(this._half, this._half);

        this._context.arc(
            this._half,
            this._half,
            radius,
            Math.PI * -90 / 180,
            Math.PI * angle / 180,
            false
        );

        this._context.closePath();
      
        this._context.fill();

        return this;
    };

    MINION.widget.Timer.prototype._drawBackgroundCircle = function(angle, radius)
    {
        this.setFill(.66, 1);

        this._context.beginPath();

        this._context.moveTo(this._half, this._half);

        this._context.arc(
            this._half,
            this._half,
            radius,
            Math.PI * -90 / 180,
            Math.PI * 270 / 180,
            false
        );

        this._context.closePath();
      
        this._context.fill();
        
        this.setFill(.5, 1);
    };

    MINION.widget.Timer.prototype.pulse = function()
    {
        this._pulseBrighten();
    };

    MINION.widget.Timer.prototype._pulseBrighten = function()
    {
        var gray = .5,
            step = .01,
            that = this;

        var brighten = setInterval(function() {
            if (that._stopPulse) {
                clearInterval(brighten);
                return;
            }

            that.setFill(gray, 1)
                .drawCircle(360);

            gray += step;

            if (gray >= .9) {
                clearInterval(brighten);
                that._pulseDarken();
            }
        }, 25);
    };

    MINION.widget.Timer.prototype._pulseDarken = function()
    {
        var gray = .9,
            step = .01,
            that = this;

        var darken = setInterval(function() {
            if (that._stopPulse) {
                clearInterval(darken);
                return;
            }

            that.setFill(gray, 1)
                .drawCircle(360);

            gray -= step;

            if (gray <= .5) {
                clearInterval(darken);
                that._pulseBrighten();
            }
        }, 25);
    };

    MINION.widget.Timer.prototype.shrink = function(gray)
    {
        var radius  = this._half,
            opacity = 1,
            step    = 0.05,
            that    = this;

        var shrink = setInterval(function() {
            opacity -= step;
            
            if (radius < 1) {
                that.clear();
                clearInterval(shrink);
                that.start();
                return;
            }

            that.setFill(gray, opacity)
                .drawCircle(360, radius);

            radius = that._half * opacity;
        }, 10);
    };

    MINION.widget.Timer.prototype.stopPulse = function()
    {
        this._stopPulse = true;
    };

    MINION.widget.Timer.prototype.finish = function()
    {
        this.stopPulse();
        this.shrink();
    };

    MINION.widget.Timer.prototype.start = function()
    {
        var angle = 0,
            that  = this;

        this._stopPulse = false;

        var timer = setInterval(function() {
            angle++;

            that.drawCircle(angle);

            if (angle > 360) {
                clearInterval(timer);

                that.pulse();

                that.runCallback();
            }
        }, (this._seconds * 1000) / 360);
    };
})(
    MINION
);
