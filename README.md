Minion
======

Minion is a simple website monitoring system written in Node.js.  The project
is in its early stages.  It currently provides HTTP monitoring, a basic web
frontend, and support for email notifications.  Minion is released under the
New BSD License.


Dependencies
------------

* MongoDB
* Node.js 0.6.x
* Node.js Modules
    * request
    * mongodb-node-native
    * Handlebars
    * forever


Roadmap
-------

### Next Month

0. ~~Notification log and monitoring log in the web frontend~~.
0. npm.
0. Support for Twilio API for SMS and phone notifications.
0. More options for HTTP check, including ability to specify an alternate path and POST fields.
0. ~~Ability to adjust notifications and check intervals on a per-site basis.~~

### 2-3 Months

0. Additional checks, including SSL certificate verification, custom HTTP checks, and TCP connectivity checks.
0. Support for multiple monitoring locations.


Usage
-----

0. Specify mail transport credentials in your config.js file.  
0. Navigate to the web frontend to add sites.  The web frontend listens on port 9855 by default.  
0. Run minion either directly with `node minion.js` or, preferably, with `forever start minion.js`.

Checks will be performed every minute.


