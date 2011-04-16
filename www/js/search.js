if ('undefined' == typeof MINION.nav) {
    MINION.nav = {};
}

(function(MINION, YD, YE) {
    var _blurText = 'Search for domains...',
        _input;

    MINION.nav.Search = function(manager) 
    {
        _input = _buildInput();
        manager.getSearchContainer().appendChild(_input);

        YE.on(_input, 'keyup', function(e) {
            manager.getPanel('server-status').filter(
                { value: 'all' }, 
                _input.value
            );

            manager.getServerNavigation().select('all');

            manager.showPanel('server-status');
        });
    };

    MINION.nav.Search.prototype.clear = function()
    {
        _input.value = _blurText;
        YD.addClass(_input, 'minion-search-blurred');
        
        var panel = manager.getPanel('server-status');
        panel.filter({ value: 'all' }, '');

        manager.showPanel('server-status');
    };

    var _buildInput = function() 
    {
        var input = document.createElement('input');
        YD.addClass(input, 'minion-search');
        YD.addClass(input, 'minion-search-blurred');
        input.type  = 'text';
        input.value = _blurText;

        YE.on(input, 'focus', function(e) {
            if (_blurText === input.value) {
                input.value = '';
            }

            YD.removeClass('minion-search-blurred');
        });

        YE.on(input, 'blur', function(e) {
            if (! input.value) {
                input.value = _blurText;
            }

            YD.addClass('minion-search-blurred');
        });

        return input;
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event
);
