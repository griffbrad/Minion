if ('undefined' == typeof MINION.panel) {
    MINION.panel = {};
}

(function(MINION, YD, YE, YC, YJ, YDT) {
    var _header, 
        _backLink, 
        _loading,
        _domain,
        _log;

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

        _domain = domain;
       
        YC.asyncRequest(
            'GET',
            'domain.php?domain=' + _domain.name,
            {
                scope: this,
                success: function(o) {
                    _loading.style.display = 'none';

                    if (_log) {
                        this._container.removeChild(_log);
                    }

                    _log = _displayLog(
                        YJ.parse(o.responseText),
                        this._container
                    );
                }
            }
        );

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

        _loading = document.createElement('div');
        YD.addClass(_loading, 'minion-loading');
        _loading.appendChild(document.createTextNode('Loading domain information'));
        content.appendChild(_loading);

        return div;
    };
    
    var _buildThead = function()
    {
        var thead = document.createElement('thead');

        var tr = document.createElement('tr');
        thead.appendChild(tr);

        var headers = [
            { label: 'Task', width: '20%' },
            { label: 'Status', width: '10%' },
            { label: 'Execution Time', width: '20%' },
            { label: 'Details', width: '50%' }
        ];

        for (var i = 0; i < headers.length; i++) {
            var header = headers[i],
                th     = document.createElement('th');

            th.appendChild(document.createTextNode(header.label));
            
            th.width = header.width;

            tr.appendChild(th);
        }

        return thead;
    };

    var _displayLog = function(data, container)
    {
        content = document.createElement('div');
        YD.addClass(content, 'minion-panel-content');
        container.appendChild(content);

        var table = document.createElement('table');
        YD.addClass(table, 'minion-listing');
        table.cellSpacing = 0;
        content.appendChild(table);

        table.appendChild(_buildThead());

        var tbody = document.createElement('tbody');
        table.appendChild(tbody);

        for (var i = 0; i < data.length; i++) {
            var tr = document.createElement('tr');

            tr.appendChild(_renderTask(data[i]));
            tr.appendChild(_renderStatus(data[i]));
            tr.appendChild(_renderExecutionTime(data[i]));
            tr.appendChild(_renderDetails(data[i]));

            tbody.appendChild(tr);
        }

        return content;
    };

    var _renderTask = function(data)
    {
        var td = document.createElement('td');
        td.width = '20%';

        td.appendChild(
            document.createTextNode(data.task)
        );

        return td;
    };

    var _renderStatus = function(data)
    {
        var td = document.createElement('td');
        td.width = '10%';

        if (data.success) {
            YD.addClass(td, 'minion-status-success');

            td.appendChild(
                document.createTextNode('Passed')
            );
        } else {
            YD.addClass(td, 'minion-status-failure');

            td.appendChild(
                document.createTextNode('Failed')
            );
        }

        return td;
    };

    var _renderExecutionTime = function(data)
    {
        var td   = document.createElement('td');
        td.width = '20%';

        var time = new Date(
            Date.parse(data.executionTime.replace(/-/g, '/'))
        );

        var formatted = YDT.format(
            time,
            { format: '%b %e, %Y %R' }
        );

        td.appendChild(
            document.createTextNode(formatted)
        );

        return td;
    };

    var _renderDetails = function(data)
    {
        var td = document.createElement('td');
        td.width = '50%';

        td.appendChild(
            document.createTextNode(data.details)
        );

        return td;
    };
})(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event,
    YAHOO.util.Connect,
    YAHOO.lang.JSON,
    YAHOO.util.Date
);
