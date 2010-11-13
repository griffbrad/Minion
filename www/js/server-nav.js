if ('undefined' == typeof MINION.nav) {
    MINION.nav = {};
}

(function(MINION, YD, YE) {
    MINION.nav.Servers = function(manager, serverStatusPanel) {
        var header = _buildHeader(manager);
        manager.getNavContainer().appendChild(header);

        var list = _buildList(manager.getServers(), serverStatusPanel);
        manager.getNavContainer().appendChild(list);
    };

    _buildHeader = function()
    {
        var header = document.createElement('h3');
       
        header.appendChild(
            document.createTextNode('Servers')
        );
       
        return header;
    };

    _buildList = function(servers, panel)
    {
        var ul = document.createElement('ul');

        var liNodes = [];

        var li = _buildLi('View All', 'server-all', 'all');
        YD.addClass(li, 'selected');
        li.firstChild.checked = true;
        ul.appendChild(li);

        liNodes.push(li);

        YE.on(li, 'click', function(e) {
            this.checked = true;
            _applySelected(this.parentNode, liNodes);
            panel.filter(this);
        }, li.firstChild, true);

        for (var index in servers) {
            var server = servers[index];

            var li = _buildLi(index, index, index, server);
            ul.appendChild(li);

            liNodes.push(li);

            YE.on(li, 'click', function(e) {
                this.checked = true;
                _applySelected(this.parentNode, liNodes);
                panel.filter(this)
            }, li.firstChild, true);
        }

        return ul;
    }

    _applySelected = function(li, nodes)
    {
        for (var i = 0; i < nodes.length; i++) {
            YD.removeClass(nodes[i], 'selected');
        }

        YD.addClass(li, 'selected');
    };

    _buildLi = function(text, id, value, server)
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

    _buildStatusProgress = function(server)
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

    _buildInput = function(id, value)
    {
        var input = document.createElement('input');
        input.type  = 'radio';
        input.name  = 'server';
        input.value = value;
        input.id    = id;
        return input;
    };

    _buildLabel = function(htmlFor, text)
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
