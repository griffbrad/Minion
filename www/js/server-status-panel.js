if ('undefined' == typeof MINION.panel) {
    MINION.panel = {};
}

(function(MINION, YD, YE, YS, YDT) {
    var _rows       = [],
        _domainRows = [];

    MINION.panel.ServerStatus = function(manager)
    {
        this._table        = _buildTable(manager);
        this._footer       = _buildFooter();
        this._toolbar      = _buildToolbar(manager, this);
        this._manager      = manager;
        this._onlyFailures = false;

        this._tableContainer = document.createElement('div');
        YD.addClass(this._tableContainer, 'minion-table-container');
        this._tableContainer.appendChild(this._table);

        manager.getContainer().appendChild(this._tableContainer);
        manager.getContainer().appendChild(this._footer.container);
        manager.getToolbarContainer().appendChild(this._toolbar);

        if (manager.isMobile()) {
            YD.addClass(manager.getContainer(), 'minion-inactive');
        }

        this.filter({ value: 'all' });
    };

    MINION.panel.ServerStatus.prototype.refresh = function()
    {
        this._manager.getContainer().removeChild(this._tableContainer);
        this._manager.getContainer().removeChild(this._footer.container);

        delete this._table;
        delete this._tableContainer;

        _rows = [];
        _domainRows = [];

        this._manager.refresh();

        this._table = _buildTable(this._manager);

        this._tableContainer = document.createElement('div');
        YD.addClass(this._tableContainer, 'minion-table-container');
        this._tableContainer.appendChild(this._table);

        var active = this._manager.getActiveServer();

        if (this._manager.getSearch().isFocused()) {
            this.filter({value: 'all'}, this._manager.getSearch().getValue());
        } else if (active) {
            this.filter({value: active});
        } else {
            this.filter({value: 'all'});
        }
        
        this._manager.getContainer().appendChild(this._tableContainer);
        this._manager.getContainer().appendChild(this._footer.container);
    };

    MINION.panel.ServerStatus.prototype.show = function()
    {
        this._tableContainer.style.display = 'block';
        this._footer.container.style.display = 'block';
        this._toolbar.style.display = 'block';
    }
    
    MINION.panel.ServerStatus.prototype.hide = function()
    {
        this._tableContainer.style.display = 'none';
        this._footer.container.style.display = 'none';
        this._toolbar.style.display = 'none';
    }

    MINION.panel.ServerStatus.prototype.filter = function(selected, search)
    {
        var lastRow   = null,
            displayed = 0;

        for (var i = 0; i < _rows.length; i++) {
            YD.removeClass(_rows[i], 'last');

            if ('all' === selected.value) {
                _rows[i].style.display = 'table-row';

                displayed++;
            } else if (YD.hasClass(_rows[i], selected.value)) {
                _rows[i].style.display = 'table-row';

                lastRow = _rows[i];

                displayed++;
            } else {
                _rows[i].style.display = 'none';
            }
        }

        if (search) {
            search = search.toLowerCase();

            for (var i = 0; i < _domainRows.length; i++) {
                var domainRow = _domainRows[i];

                if (-1 === domainRow.domain.name.toLowerCase().indexOf(search)
                    && 'table-row' === domainRow.row.style.display) {
                    domainRow.row.style.display = 'none';
                    displayed--;
                }
            }
        }

        if (this._onlyFailures) {
            for (var i = 0; i < _domainRows.length; i++) {
                var domainRow = _domainRows[i];

                if (domainRow.domain.status
                    && 'table-row' === domainRow.row.style.display) {

                    domainRow.row.style.display = 'none';
                    displayed--;
                }
            }
        }

        if (lastRow) {
            YD.addClass(lastRow, 'last');
        }
     
        var suffix = 's';

        if (1 === displayed) {
            suffix = ''; 
        }

        if (0 > displayed) {
            displayed = 0;
        }

        this._footer.countCell.innerHTML = displayed + ' Domain' + suffix;
    };

    MINION.panel.ServerStatus.prototype.getId = function()
    {
        return 'server-status';
    };

    var _buildToolbar = function(manager, that)
    {
        var toolbar = document.createElement('div');

        var refresh = document.createElement('a');
        refresh.id = 'minion-refresh';
        YD.addClass(refresh, 'minion-button');
        refresh.appendChild(document.createTextNode('Refresh'));
        toolbar.appendChild(refresh);
       
        YE.on(refresh, 'click', function(e) {
            this.refresh();
        }, that, true);


        var failures = document.createElement('a');
        YD.addClass(failures, 'minion-button');
        YD.addClass(failures, 'minion-failures');

        var check = document.createElement('input');
        check.type = 'checkbox';
        check.id = 'failures';
        failures.appendChild(check);

        var label = document.createElement('label');
        label.htmlFor = 'failures';
        label.appendChild(document.createTextNode('Only Show Failures'));
        failures.appendChild(label);

        toolbar.appendChild(failures);

        YE.on(failures, 'click', function(e) {
            if (e.target == failures) {
                check.checked = (! (check.checked));
            }
            
            var active = this._manager.getActiveServer();

            this._onlyFailures = check.checked;

            if (check.checked) {
                YD.addClass(failures, 'minion-button-pressed');
            } else {
                YD.removeClass(failures, 'minion-button-pressed');
            }

            if (this._manager.getSearch().isFocused()) {
                this.filter({value: 'all'}, this._manager.getSearch().getValue());
            } else if (active) {
                this.filter({value: active});
            } else {
                this.filter({value: 'all'});
            }
        }, that, true);

        return toolbar;
    };
    
    var _buildTable = function(manager, domainPanel)
    {
        var table = document.createElement('table');
        table.id          = 'minion-listing';
        table.cellSpacing = 0;
        
        table.appendChild(_buildThead());

        var body = _buildTbody(manager, domainPanel);
        table.appendChild(body);

        return table;
    };

    var _buildThead = function()
    {
        var thead = document.createElement('thead');

        var tr = document.createElement('tr');
        thead.appendChild(tr);

        var headers = [
            'Domain',
            'Status',
            'Last Checked'
        ];

        for (var i = 0; i < headers.length; i++) {
            var th = document.createElement('th');
            th.appendChild(document.createTextNode(headers[i]));
            tr.appendChild(th);
        }

        return thead;
    }

    var _buildTbody = function(manager)
    {
        var tbody = document.createElement('tbody');
        var data  = manager.getData();

        var callback = function(e) {
            manager.getPanel('domain').setDomain(this);
            manager.showPanel('domain');
        };

        for (var i = 0; i < data.length; i++) {
            var domain = data[i];

            var tr = document.createElement('tr');

            for (var n = 0; n < domain.servers.length; n++) {
                YD.addClass(tr, domain.servers[n]);
            }

            tbody.appendChild(tr);

            var format = manager.getSetting('desktop-date-format');

            if (manager.isMobile()) {
                format = manager.getSetting('mobile-date-format');
            }

            tr.appendChild(_renderName(domain));            
            tr.appendChild(_renderStatus(domain));            
            tr.appendChild(_renderLastChecked(domain, format));

            YE.on(tr, 'click', callback, domain, true);

            _rows.push(tr);

            _domainRows.push({
                domain: domain,
                row:    tr
            });
        }

        return tbody;
    };

    var _renderName = function(domain)
    {
        var td = document.createElement('td');

        td.appendChild(
            document.createTextNode(domain.name)  
        );

        return td;
    };
    
    var _renderStatus = function(domain)
    {
        var td = document.createElement('td');

        var success = 0;
        var total   = 0;
        var status = null;

        for (var task in domain.tasks) {
            total++; 

            if ('success' === domain.tasks[task].status) {
                success++;
            }
        }

        if (total > 0) {
            status = success / total;
        }

        if (null === status) {
            YD.addClass(td, 'minion-status-null');
           
            td.appendChild(
                document.createTextNode('No Checks Run')
            );
        } else if (1 === status) {
            YD.addClass(td, 'minion-status-success');
            
            td.appendChild(
                document.createTextNode('100% Passed')
            );
        } else {
            YD.addClass(td, 'minion-status-failure');

            var failures = total - success;
            var content  = document.createTextNode(
                failures + ' ' + (1 === failures ? 'Failure' : 'Failures')
            );

            td.appendChild(content);
        }

        return td;
    };

    var _renderLastChecked = function(domain, format)
    {
        var td = document.createElement('td');
    
        var time = null;

        for (var task in domain.tasks) {
            var taskTime = new Date(
                Date.parse(domain.tasks[task].time.replace(/-/g, '/'))
            );

            if (null === time || taskTime > time) {
                time = taskTime;
            }
        }

        if (null !== time) {
            var dateFormatted = YDT.format(
                time, 
                { 'format': format }
            );

            td.appendChild(
                document.createTextNode(dateFormatted)
            );
        } else {
            YD.addClass(td, 'minion-status-null');

            td.appendChild(
                document.createTextNode('Never Checked')
            );
        }

        return td;
    };

    var _buildFooter = function()
    {
        var container = document.createElement('div');
        YD.addClass(container, 'minion-server-footer');

        var left = document.createElement('div');
        YD.addClass(left, 'first');
        container.appendChild(left);

        var countCell = document.createElement('div');
        YD.addClass(countCell, 'minion-domain-count');
        container.appendChild(countCell);
        
        return {
            'container': container,
            'countCell': countCell
        };
    };
 })(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event,
    YAHOO.util.Selector,
    YAHOO.util.Date
);
