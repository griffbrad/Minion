if ('undefined' == typeof MINION) {
    var MINION = {};
}

(function(MINION, YD, YE, YS, YC, YJ) {
    var _panels       = [],
        _servers      = {},
        _activeServer = null;

    MINION.manager = function(container, navContainer, searchContainer,
        toolbarContainer, mobile, data) 
    {
        this._navContainer     = navContainer;
        this._container        = container;
        this._searchContainer  = searchContainer;
        this._toolbarContainer = toolbarContainer;

        this._data = _initData(data);
       

        _mobile = mobile;

        var domainPanel = new MINION.panel.Domain(this);
        _addPanel(domainPanel);

        var panel = new MINION.panel.ServerStatus(this);
        _addPanel(panel);

        this._serverNavigation = new MINION.nav.Servers(this);

        this._search = new MINION.nav.Search(this);

        this.showPanel('server-status');

        this._bindKeyboardShortcuts();
    };

    MINION.manager.prototype.getSetting = function(key)
    {
        var settings = {
            'site-name' : 'Minion',
            'desktop-date-format': '%c',
            'mobile-date-format': '%c'
        };

        return settings[key];
    }

    MINION.manager.prototype.refresh = function()
    {
        var message = new MINION.widget.Message('Refreshing server and domain data...');

        YC.asyncRequest(
            'GET',
            'data.php',
            {
                scope: this,
                success: function(o) {
                    this._data = _initData(YJ.parse(o.responseText));

                    message.setText('Data successfully refreshed')
                           .clearAfterDelay();
                },
                failure: function(o) {
                    message.setText('Could not refresh data.  Please try again.')
                           .clearAfterDelay();
                }
            }
        );

    };

    MINION.manager.prototype._bindKeyboardShortcuts = function()
    {
        YE.on(window, 'keyup', function(e) {
            YE.preventDefault(e);

            switch (e.which) {
                case 191 : // Front slash
                    this._search.focus();
                    break;
                case 74 : // j
                    this._serverNavigation.next();
                    break;
                case 75 : // k
                    this._serverNavigation.prev();
                    break;
                case 82 : // r
                    this.getPanel('server-status').refresh();
                    break;
                case 27 : // escape
                    this._search.clear();
                    this._serverNavigation.select('all');
                    break;
            }
        }, this, true);
    };

    MINION.manager.prototype.isMobile = function()
    {
        return _mobile;
    };

    MINION.manager.prototype.getSearch = function()
    {
        return this._search;
    };

    MINION.manager.prototype.getServerNavigation = function()
    {
        return this._serverNavigation;
    };

    MINION.manager.prototype.getContainer = function()
    {
        return this._container;
    };

    MINION.manager.prototype.getToolbarContainer = function()
    {
        return this._toolbarContainer;
    };

    MINION.manager.prototype.getSearchContainer = function()
    {
        return this._searchContainer;
    }

    MINION.manager.prototype.getActiveServer = function()
    {
        return _activeServer;
    };

    MINION.manager.prototype.setActiveServer = function(server)
    {
        if ('all' === server) {
            server = null;
        }

        _activeServer = server;
    }

    MINION.manager.prototype.getNavContainer = function()
    {
        return this._navContainer;
    };

    MINION.manager.prototype.getData = function()
    {
        return this._data;
    };

    MINION.manager.prototype.showPanel = function(id)
    {
        for (var i = 0; i < _panels.length; i++) {
            if (_panels[i].getId() === id) {
                _panels[i].show();
            } else {
                _panels[i].hide();
            }
        }

        window.scroll(0, 0);
    };

    MINION.manager.prototype.getPanel = function(id)
    {
        for (var i = 0; i < _panels.length; i++) {
            if (_panels[i].getId() === id) {
                return _panels[i];
            }
        }

        return false;
    }

    MINION.manager.prototype.getServers = function()
    {
        return _servers;
    }

    var _addPanel = function(panel) 
    {
        _panels.push(panel);
    };

    var _initData = function(data)
    {
        for (var i = 0; i < data.length; i++) {
            if (! data[i].tasks) {
                data[i].tasks = [];
            }

            var domain = data[i];
            var status = 1;

            for (var task in domain.tasks) {
                if ('success' !== domain.tasks[task].status) {
                    status = 0;
                    break;
                }
            }

            data[i].status = status;

            for (var n = 0; n < domain.servers.length; n++) {
                var server = domain.servers[n];

                if (! _servers[server]) {
                    _servers[server] = [];
                }

                _servers[server].push(status);
            }

        }

        return data;
    };
})(
    MINION,
    YAHOO.util.Dom, 
    YAHOO.util.Event,
    YAHOO.util.Selector,
    YAHOO.util.Connect,
    YAHOO.lang.JSON
);
