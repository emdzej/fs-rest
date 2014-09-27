var express = require('express');
var path = require('path');
var fs = require('fs');
var util = require('util');
var cors = require('cors')
var uuid = require('node-uuid');
var app = express();
var dataDir = 'data/';

var route = /^\/([^/]+)\/?([^/]*)$/;

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

function getResourcePath(resource, id) {
	var filePath = path.join(process.cwd(), dataDir, resource, (id ? id + '.json' : ''));
	return filePath;
}

function onGet(request, response, next) {
    console.log("Got GET request");
	var resource = request.params[0] || null;
	var id = request.params[1] || null
    var filter = id ? null : isEmpty(request.query) ? null : request.query;
    console.log("Using filter: " );
    console.log(filter);
	var filePath = getResourcePath(resource, id);
	fs.exists(filePath, function(exists) {
		if (exists) {
            if (id) {
                console.log('Resource ' + filePath + ' found, sending');
                response.sendFile(filePath);
            } else {
                var files = fs.readdirSync(filePath);
                var contents = [];

                var i = 0;
                for (i = 0; i < files.length; i++) {
                    var fileName = path.join(filePath, files[i]);

                    var content = fs.readFileSync(fileName);
                    if (filter) {
                        console.log('Checking object for match');
                        var data = JSON.parse(content);
                        console.log(data);
                        var match = true;
                        for (var property in filter) {
                            if (data[property] != filter[property]) {
                                match = false;
                                break;
                            }
                        }
                        if (match) {
                            contents.push(content);
                        }
                    } else {
                        contents.push(content);
                    }
                }
                var result = '[';
                for (i = 0; i < contents.length; i++) {
                    result += contents[i];
                    if (i < contents.length - 1) {
                        result += ',';
                    }
                }
                result += ']';
                response.set('Content-Type', 'application/json');
                response.send(result);
            }
		} else {
			console.log('Resource ' + filePath + ' was not found');
			response.status(404).end();
		}
	});
}

function onPut(request, response, next) {
    console.log("Got PUT request");
	var resource = request.params[0] || null;
	var id = request.params[1] || null
	var filePath = getResourcePath(resource, id);
    fs.exists(filePath, function(exists) {
        if (exists) {
            console.log("Resource " + filePath + " found, updating");
            fs.writeFile(filePath, request.rawBody, function(error) {
                if (error) {
                    response.status(500).end();
                } else {
                    response.status(200).end();
                }
            });
        } else {
            console.log("Resource " + filePath + " does not exist, nothing to update!");
            response.status(500).end();
        }
    });
}

function onPost(request, response, next) {
    console.log("Got POST request");
	var resource = request.params[0] || null;
	var id = request.params[1] || uuid.v4();
	var filePath = getResourcePath(resource, id);
	fs.exists(filePath, function(exists) {
		if (exists) {
			console.log('Resource ' + filePath + ' found, use PUT to update');
			response.status(500).end();
		} else {
			console.log('Resource ' + filePath + ' was not found, creating');
			fs.writeFile(filePath, request.rawBody, function(error) {
				if (error) {
                    console.log(error);
					response.status(500).end();
				} else {	
					response.json({"id" : id});
				}
			});
		}
	});

}

function onDelete(request, response, next) {
    console.log("Got DELETE request");
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
// by default - allow requests from everywhere
app.use(cors());

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
