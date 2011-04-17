if ('undefined' == typeof MINION.nav) {
    MINION.nav = {};
}

(function(MINION, YD, YE) {
    var _liNodes = [];

    MINION.nav.Servers = function(manager) 
    {
        var header = _buildHeader(manager);
        manager.getNavContainer().appendChild(header);

        var list = _buildList(manager);
        manager.getNavContainer().appendChild(list);

        this._manager = manager;
    };

    MINION.nav.Servers.prototype.clear = function()
    {
        for (var i = 0; i < _liNodes.length; i++) {
            YD.removeClass(_liNodes[i], 'selected');
        }
    };

    MINION.nav.Servers.prototype.next = function()
    {
        for (var i = 0; i < _liNodes.length; i++) {
            var node = _liNodes[i];

            if (YD.hasClass(node, 'selected') && _liNodes[i + 1]) {
                var next = _liNodes[i + 1];
                next.firstChild.checked = true;
                _applySelected(next, _liNodes);
            
                this._manager.setActiveServer(next.firstChild.value);
            
                this._manager.getPanel('server-status').filter(next.firstChild);
                this._manager.showPanel('server-status');
                break;
            }
        }
    };
    
    MINION.nav.Servers.prototype.prev = function()
    {
        for (var i = 0; i < _liNodes.length; i++) {
            var node = _liNodes[i];

            if (YD.hasClass(node, 'selected') && _liNodes[i - 1]) {
                var prev = _liNodes[i - 1];
                prev.firstChild.checked = true;
                _applySelected(prev, _liNodes);
                
                this._manager.setActiveServer(prev.firstChild.value);
                
                this._manager.getPanel('server-status').filter(prev.firstChild);
                this._manager.showPanel('server-status');
                break;
            }
        }
    };

    MINION.nav.Servers.prototype.select = function(server)
    {
        var id    = 'server-' + server,
            node = YD.get(id);
           
        node.checked = true;
        _applySelected(node.parentNode, _liNodes);
    };

    var _buildHeader = function()
    {
        var header = document.createElement('h3');
       
        header.appendChild(
            document.createTextNode('Servers')
        );
       
        return header;
    };

    var _buildList = function(manager)
    {
        var ul = document.createElement('ul');

        var servers  = manager.getServers();
        var callback = function(e) {
            this.checked = true;
            _applySelected(this.parentNode, _liNodes);

            manager.setActiveServer(this.value);

            if (manager.isMobile()) {
                YD.addClass(manager.getNavContainer(), 'minion-inactive');
            }

            manager.getSearch().clear();
            manager.getPanel('server-status').filter(this);
            manager.showPanel('server-status');

            if (manager.isMobile()) {
                YD.removeClass(manager.getContainer(), 'minion-inactive');
            }
        };

        var li = _buildLi('View All', 'server-all', 'all');

        if (! manager.isMobile()) {
            YD.addClass(li, 'selected');
            li.firstChild.checked = true;
        }

        ul.appendChild(li);

        _liNodes.push(li);

        for (var index in servers) {
            var server = servers[index];

            var li = _buildLi(index, index, index, server);
            ul.appendChild(li);

            _liNodes.push(li);
        }

        for (var i = 0; i < _liNodes.length; i++) {
            var li = _liNodes[i];
            YE.on(li, 'click', callback, li.firstChild, true);
        }

        return ul;
    }

    var _applySelected = function(li, nodes)
    {
        for (var i = 0; i < nodes.length; i++) {
            YD.removeClass(nodes[i], 'selected');
        }

        YD.addClass(li, 'selected');
    };

    var _buildLi = function(text, id, value, server)
    {
        var li = document.createElement('li');

        var input = _buildInput(id, value);
        li.appendChild(input);

        var label = _buildLabel(id, text);
        li.appendChild(label);

        if (server) {
            var progress = _buildStatusProgress(server);

            if (progress) {
                li.appendChild(progress);
            }
        }

        return li;
    }

    var _buildStatusProgress = function(server)
    {
        var failures = 0;

        for (var i = 0; i < server.length; i++) {
            if (! server[i]) {
                failures++;
            }
        }

        if (! failures) {
            return null;
        }

        var width = (failures / server.length) * 100;

        if (10 > width) {
            width = 10;
        }

        var outer = document.createElement('span');
        YD.addClass(outer, 'minion-server-failure');

        var inner = document.createElement('span');
        YD.addClass(inner, 'minion-server-failure-fill');
        inner.style.width = width + '%';
        outer.appendChild(inner);

        return outer;
    };

    var _buildInput = function(id, value)
    {
        var input = document.createElement('input');
        input.type  = 'radio';
        input.name  = 'server';
        input.value = value;
        input.id    = id;
        return input;
    };

    var _buildLabel = function(htmlFor, text)
    {
        var label = document.createElement('label');
        
        label.htmlFor = htmlFor;
        
        label.appendChild(
            document.createTextNode(text)
        );

        return label;
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event
);
