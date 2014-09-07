var express = require('express');
var fs = require('fs');
var app = express();
var dataDir = 'data/';

var route = /^\/([^/]+)\/?([^/]*)$/;

function getResourcePath(resource, id) {
	var filePath = process.cwd() + '/' +  dataDir + resource + '/' + id + '.json';
	return filePath;
}

function onGet(request, response, next) {
	var resource = request.params[0] || null;
	var id = request.params[1] || null
	var filePath = getResourcePath(resource, id);
	fs.exists(filePath, function(exists) {
		if (exists) {
			console.log('Resource ' + filePath + ' found, sending');
			response.sendFile(filePath);
		} else {
			console.log('Resource ' + filePath + ' was not found');
			response.status(404).end();
		}
	});
}

function onPut(request, response, next) {
	var resource = request.params[0] || null;
	var id = request.params[1] || null
	var filePath = getResourcePath(resource, id);
	fs.writeFile(filePath, request.rawBody, function(error) {
		if (error) {
			response.status(500).end();
		} else {	
			response.status(200).end();
		}
	});
}

function onPost(request, response, next) {
	var resource = request.params[0] || null;
	var id = request.params[1] || null
	var filePath = getResourcePath(resource, id);
	fs.exists(filePath, function(exists) {
		if (exists) {
			console.log('Resource ' + filePath + ' found, use PUT to update');
			response.status(500).end();
		} else {
			console.log('Resource ' + filePath + ' was not found, creating');
			fs.writeFile(filePath, request.rawBody, function(error) {
				if (error) {
					response.status(500).end();
				} else {	
					response.status(200).end();
				}
			});
		}
	});

}

function onDelete(request, response, next) {
	var resource = request.params[0] || null;
	var id = request.params[1] || null
	var filePath = getResourcePath(resource, id);
	fs.exists(filePath, function(exists) {
		if (exists) {
			fs.unlink(filePath, function(error) {
				if (error) {
					response.status(500).end();
				} else {
					response.status(200).end();
				}
			});
		} else {
			console.log('Resource ' + filePath + ' was not found');
			response.status(404).end();
		}
	});



}

app.use(function(req, res, next) {
  req.rawBody = '';
  req.setEncoding('utf8');

  req.on('data', function(chunk) { 
    req.rawBody += chunk;
  });

  req.on('end', function() {
    next();
  });
});

app.get(route, onGet);
app.put(route, onPut);
app.post(route, onPost);
app.delete(route, onDelete);

app.listen(8080);
