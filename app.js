var certroot = '/home/pki';
var listen   = 8080;

var assert   = require('assert');
var exec     = require('child_process').exec;
var express  = require('express');
var ns       = require('dns');
var xapp     = express();

function sendFile(ca, host, ext, res) {
    exec("/bin/cat " + certroot + "/" + ca + "/" + host + "." + ext, function (err, sto, ste) {
	    console.log("Sending", ca + "/" + host + "." + ext);
	    res.send(sto);
	});
}

function reverseLookup(what, ip, ca, host, res) {
    ns.reverse(ip, function (err, domains) {
	    if (err != null) {
		res.send('client has no PTR record');
		console.log('unexpected access from', ip);
	    } else {
		domains.forEach(function (domain) {
			ns.lookup(domain, function (derr, address, family) {
				if (ip == address) {
				    sendFile(ca, host, what, res);
				} else {
				    console.log("Unexpected access from", ip, "requesting", ca + "/" + host, "certificate");
				    res.send("");
				}
			    });
		    });
	    }
	});
}

xapp.get(/^\/certificate\/([^\/]+)\/([^\/]+)\//, function (req, res, next) {
	var ca   = req.params[0];
	var cert = req.params[1];
	var host = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	reverseLookup("crt", host, ca, cert, res);
    });

xapp.get(/^\/key\/([^\/]+)\/([^\/]+)\//, function (req, res, next) {
	var ca   = req.params[0];
	var cert = req.params[1];
	var host = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

	reverseLookup("key", host, ca, cert, res);
    });

xapp.listen(listen, 'localhost');
console.log('listening on http://localhost:' + listen);
console.log('consider using https to distribute your keys');
