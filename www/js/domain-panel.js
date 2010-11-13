if ('undefined' == typeof MINION.panel) {
    MINION.panel = {};
}

(function(MINION, YD, YE, YS, YDT) {
    var _rows = [];

    MINION.panel.Domain = function(manager)
    {
        this._table = _buildTable(manager.getData());
        manager.getContainer().appendChild(this._table);
    };

    MINION.panel.Domain.prototype.show = function()
    {
        this._table.style.display = 'block';
    }
    
    MINION.panel.Domain.prototype.hide = function()
    {
        this._table.style.display = 'display';
    }

    MINION.panel.Domain.prototype.filter = function(selected)
    {
        var lastRow = null;

        for (var i = 0; i < _rows.length; i++) {
            YD.removeClass(_rows[i], 'last');

            if ('all' === selected.value) {
                _rows[i].style.display = 'table-row';
            } else if (YD.hasClass(_rows[i], selected.value)) {
                _rows[i].style.display = 'table-row';

                lastRow = _rows[i];
            } else {
                _rows[i].style.display = 'none';
            }
        }

        if (lastRow) {
            YD.addClass(lastRow, 'last');
        }
    };
    
    _buildTable = function(data)
    {
        var table = document.createElement('table');
        table.id          = 'minion-listing';
        table.cellSpacing = 0;
        
        table.appendChild(_buildThead());

        var body = _buildTbody(data);
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

    var _buildTbody = function(data)
    {
        var tbody = document.createElement('tbody');

        for (var i = 0; i < data.length; i++) {
            var domain = data[i];

            var tr = document.createElement('tr');

            for (var n = 0; n < domain.servers.length; n++) {
                YD.addClass(tr, domain.servers[n]);
            }

            tbody.appendChild(tr);

            tr.appendChild(_renderName(domain));            
            tr.appendChild(_renderStatus(domain));            
            tr.appendChild(_renderLastChecked(domain));

            _rows.push(tr);
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

    var _renderLastChecked = function(domain)
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
                { format: '%b %e, %Y %R' }
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
 })(
    MINION,
    YAHOO.util.Dom,
    YAHOO.util.Event,
    YAHOO.util.Selector,
    YAHOO.util.Date
);
