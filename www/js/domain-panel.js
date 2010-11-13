if ('undefined' == typeof MINION.panel) {
    MINION.panel = {};
}

(function(MINION, YD) {
    MINION.panel.Domain = function(manager)
    {
        this._container = _buildDisplay();

        manager.getContainer().appendChild(this._container);
    };

    MINION.panel.Domain.prototype.setDomain = function(domain)
    {
        console.log(domain.name);          
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

    var _buildDisplay = function()
    {
        var div = document.createElement('div');
        YD.addClass(div, 'minion-domain-display');
        
        var toolbar = document.createElement('div');
        YD.addClass(toolbar, 'minion-toolbar');
        div.appendChild(toolbar);

        var content = document.createElement('div');
        YD.addClass(content, 'minion-panel-content');
        div.appendChild(content);

        return div;
    };
})(
    MINION,
    YAHOO.util.Dom
);
