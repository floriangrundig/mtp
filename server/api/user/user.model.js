'use strict';
var http = require('http');
var crypto = require('crypto');
var config = require('../../config/environment');



function User(props) {
    this.login = props.login || '';
    this.role = props.role || ['user'];
    this.email = props.email || '';
    this.name = props.name || '';
    this.salt = props.salt || this.makeSalt();
    this.provider = 'local';
    this.hashedPassword = props.hashedPassword || this.encryptPassword(props.password);

}

User.prototype.validate = function () {
    console.log('unimplemented method validate was called...');
};

User.prototype.encryptPassword = function (password) {
    if (!password || !this.salt) return '';
    var salt = new Buffer(this.salt, 'base64');
    return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
};

User.prototype.makeSalt = function () {
    return crypto.randomBytes(16).toString('base64');
};

User.prototype.authenticate = function (plainText) {
    return this.encryptPassword(plainText) === this.hashedPassword;
};

User.prototype.save = function (callback) {
    var userString = JSON.stringify(this);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': userString.length
    };
    var options = {
        host: config.backendHost,
        port: config.backendPort,
        path: '/user/save',
        method: 'POST',
        headers: headers
    };


    // Setup the request.  The options parameter is
// the object we defined above.
    var req = http.request(options, function (response) {
        response.setEncoding('utf-8');

        var responseString = '';
        response.on('data', function (data) {
            responseString += data;
        });

        response.on('end', function () {
            var resultObject;
            try {
                resultObject = JSON.parse(responseString);
                callback(null, new User(resultObject));
            } catch (e) {
                callback(e, null);
            }
        });
    });
    req.on('error', function (e) {
        callback(e, null);
    });
    req.write(userString);
    req.end();
};

function create(props) {
    return new User(props);
}

function find(callback){
    var requestBody = JSON.stringify({});

    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': requestBody.length
    };
    var options = {
        host: config.backendHost,
        port: config.backendPort,
        path: '/user/find',
        method: 'POST',
        headers: headers
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
           var users = [];
            try {
                var resultObject = JSON.parse(responseString);
                for (var i = 0; i < resultObject.length; i++){
                    users.push(new User(resultObject[i]))
                }

                callback(null, users);
            } catch (e) {
                callback(e, null);
            }
        });
    });

    req.on('error', function (e) {
        callback(e, null);
    });


    req.write(requestBody);
    req.end();
}


function findById(id,callback){
    return findOne({login: id},callback)
}

function findOne(user, callback) {
    var userString = JSON.stringify(user);
    var headers = {
        'Content-Type': 'application/json',
        'Content-Length': userString.length
    };
    var options = {
        host: config.backendHost,
        port: config.backendPort,
        path: '/user/findOne',
        method: 'POST',
        headers: headers
    };
    var req = http.request(options, function (res) {
        res.setEncoding('utf-8');

        var responseString = '';

        res.on('data', function (data) {
            responseString += data;
        });

        res.on('end', function () {
            try {
                var resultObject = JSON.parse(responseString);
                callback(null, new User(resultObject));
            } catch (e) {
                callback(e, null);
            }
        });
    });

    req.on('error', function (e) {
        callback(e, null);
    });

    req.write(userString);
    req.end();

}

module.exports = {
    find: find,
    findById: findById,
    findOne: findOne,
    create: create
};
