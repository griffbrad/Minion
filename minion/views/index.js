var View       = require('./abstract'),
    Handlebars = require('handlebars'),
    util       = require('util'),
    Index;

Index = function(minion, request, response) {
    this._minion   = minion;
    this._response = response;
    this._request  = request;
};

util.inherits(Index, View);

module.exports = Index;

Index.prototype.getTemplateName = function () {
    return 'index';
};

Index.prototype.getTemplateData = function () {
    var sites = [];

    this._minion.getSites().forEach(function (site) {
        var lastError = site.getLastError();

        if (lastError) {
            lastError = lastError.toISOString();
        }

        sites.push({
            url:    site.getUrl(),
            status: site.getStatus(),
            repeats: site.getRepeats(),
            lastError: lastError
        });
    }, this);

    sites.sort(function(a, b) {
        if (a.url < b.url) {
            return -1;
        } else {
            return 1;
        }
    });

    this.registerHelper('status', this.renderStatus);
    this.registerHelper('lastError', this.renderLastError);
    
    return {
        sites: sites    
    };
};

Index.prototype.renderStatus = function (site) {
    if (site.status) {
        return new Handlebars.SafeString(
            '<span class="all_clear">No errors</span>'
        );
    } else {
        var suffix = 's';

        if (1 === site.repeats) {
            suffix = '';
        }

        return new Handlebars.SafeString(
            '<span class="error">Failed ' + site.repeats + ' Time' + suffix + '</span>'
        );
    }
};

Index.prototype.renderLastError = function (site) {
    if (site.lastError) {
        return site.lastError;
    } else {
        return new Handlebars.SafeString(
            '<span class="all_clear">No errors</span>'
        );
    }
};

