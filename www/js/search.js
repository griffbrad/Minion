if ('undefined' == typeof MINION.nav) {
    MINION.nav = {};
}

(function(MINION, YD, YE) {
    var _blurText = 'Search for domains...',
        _input,
        _container;

    MINION.nav.Search = function(manager) 
    {
        _container = document.createElement('div');
        YD.addClass(_container, 'minion-search-container');
        var inner = document.createElement('div');
        _container.appendChild(inner);
        
        _input = _buildInput(manager, _container, this);
        inner.appendChild(_input);

        manager.getSearchContainer().appendChild(_container);

        YE.on(_input, 'keyup', function(e) {
            // Allow "escape" key to propagate
            if (27 != e.which) {
                YE.stopPropagation(e);
            }

            manager.getPanel('server-status').filter(
                { value: 'all' }, 
                _input.value
            );

            manager.getServerNavigation().clear();

            manager.showPanel('server-status');
        });
    };

    MINION.nav.Search.prototype.getValue = function()
    {
        return _input.value;
    };

    MINION.nav.Search.prototype.focus = function()
    {
        _input.focus();
    };

    MINION.nav.Search.prototype.isFocused = function()
    {
        return (! (YD.hasClass(_container, 'minion-search-blurred')));
    };

    MINION.nav.Search.prototype.clear = function()
    {
        _input.value = _blurText;
        YD.addClass(_container, 'minion-search-blurred');
        
        var panel = manager.getPanel('server-status');
        panel.filter({ value: 'all' }, '');

        manager.showPanel('server-status');

        _input.blur();
    };

    var _buildInput = function(manager, container, that) 
    {
        var input = document.createElement('input');
        YD.addClass(input, 'minion-search');
        YD.addClass(container, 'minion-search-blurred');
        input.type  = 'text';
        input.value = _blurText;

        YE.on(input, 'focus', function(e) {
            if (_blurText === input.value) {
                input.value = '';
            }

            YD.removeClass(container, 'minion-search-blurred');
        });

        YE.on(input, 'blur', function(e) {
            if (! input.value) {
                that.clear();
                manager.getServerNavigation().select('all');
            }
        });

        return input;
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event
);
