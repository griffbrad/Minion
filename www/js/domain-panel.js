if ('undefined' == typeof MINION.panel) {
    MINION.panel = {};
}

(function(MINION, YD, YE) {
    var _header, _backLink;

    MINION.panel.Domain = function(manager)
    {
        this._container = _buildDisplay(manager);
        this._manager   = manager;

        manager.getContainer().appendChild(this._container);
    };

    MINION.panel.Domain.prototype.setDomain = function(domain)
    {
        var server = this._manager.getActiveServer();

        if (! server) {
            server = 'Servers';
        }

        _backLink.firstChild.nextSibling.nodeValue = server;

        _header.firstChild.nodeValue = domain.name;
    };

    MINION.panel.Domain.prototype.hide = function()
    {
        this._container.style.display = 'none';
    };
    
    MINION.panel.Domain.prototype.show = function()
    {
        this._container.style.display = 'block';
    };

    MINION.panel.Domain.prototype.getId = function()
    {
        return 'domain';
    };

    var _buildDisplay = function(manager)
    {
        var div = document.createElement('div');
        YD.addClass(div, 'minion-domain-display');
        
        var toolbar = document.createElement('div');
        YD.addClass(toolbar, 'minion-toolbar');
        div.appendChild(toolbar);

        _backLink = document.createElement('a');
        _backLink.href = '#';
        _backLink.appendChild(document.createTextNode('« Back to '));
        _backLink.appendChild(document.createTextNode(''));
        toolbar.appendChild(_backLink);
        
        YE.on(_backLink, 'click', function(e) {
            YE.preventDefault(e);
            manager.showPanel('server-status');
        });

        var content = document.createElement('div');
        YD.addClass(content, 'minion-panel-content');
        div.appendChild(content);

        _header = document.createElement('h2');
        _header.appendChild(document.createTextNode(''));
        content.appendChild(_header);

        return div;
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event
);
