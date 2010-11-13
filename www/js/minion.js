var MINION = {};

(function(MINION, YD, YE, YS) {
    var _panels  = [];
    var _servers = {};

    MINION.manager = function(container, navContainer, data) 
    {
        this._navContainer = navContainer;
        this._container    = container;
        this._data         = _initData(data);

        var domainPanel = new MINION.panel.Domain(this);
        _addPanel(domainPanel);

        var panel = new MINION.panel.ServerStatus(this);
        _addPanel(panel);

        this._serverNavigation = new MINION.nav.Servers(this);

        this.showPanel('server-status');
    };

    MINION.manager.prototype.getContainer = function()
    {
        return this._container;
    };

    MINION.manager.prototype.getActiveServer = function()
    {
        return this._activeServer;
    };

    MINION.manager.prototype.setActiveServer = function(server)
    {
        this._activeServer = server;
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
    YAHOO.util.Selector
);
