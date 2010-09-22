
/*!
 * Ext JS Connect
 * Copyright(c) 2010 Sencha Inc.
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs'),
    Path = require('path'),
    utils = require('../utils'),
    Buffer = require('buffer').Buffer,
    parseUrl = require('url').parse,
    queryString = require('querystring');

/**
 * Default browser cache maxAge of one year.
 */

const MAX_AGE = 31536000;

/**
 * Static file server.
 *
 * Options:
 *
 *   - `root`     Root path from which to serve static files.
 *   - `maxAge` Browser cache maxAge
 *
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = function staticProvider(options){
    var maxAge,
        root;

    // Support options object and root string
    if (typeof options == 'string') {
        root = options;
        maxAge = MAX_AGE;
    } else {
        options = options || {};
        maxAge = options.maxAge === undefined
            ? MAX_AGE
            : options.maxAge;
        root = process.connectEnv.staticRoot || options.root || process.cwd();
    }

    return function staticProvider(req, res, next) {
        if (req.method !== 'GET') return next();

        var url = parseUrl(req.url),
            pathname = url.pathname.replace(/\.\.+/g, '.'),
            filename = Path.join(root, queryString.unescape(pathname));

        if (filename[filename.length - 1] === '/') {
            filename += "index.html";
        }

        fs.stat(filename, function(err, stat){

            // Pass through for missing files, thow error for other problems
            if (err) {
                return err.errno === process.ENOENT
                    ? next()
                    : next(err);
            } else if (stat.isDirectory()) {
                return next();
            }

            // Serve the file directly using buffers
            function onRead(err, data) {
                if (err) return next(err);

                // Zero length buffers act funny, use a string
                if (data.length === 0) data = '';

                res.writeHead(200, {
                    "Content-Type": utils.mime.type(filename),
                    "Content-Length": data.length,
                    "Last-Modified": stat.mtime.toUTCString(),
                    "Cache-Control": "public max-age=" + maxAge
                });
                res.end(data);
            }

            fs.readFile(filename, onRead);
        });
    };

};
