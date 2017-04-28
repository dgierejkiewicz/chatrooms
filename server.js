// node modules
var http 	= require('http');
var fs 		= require('fs');
var path 	= require('path');
var mime 	= require('mime');
var cache 	= {};

/********************************* server **********************************/
var server = http.createServer(function (request, response) {
	var filePath = false;
	if (request.url == "/") {
		filePath = "public/index.html";
	} else {
		filePath = "public" + request.url;
	}
	var absPath = './' + filePath;
	serveStatic(response, cache, absPath);
});
server.listen(3000, function () {
	console.log('Server runs on port 3000.');
});


/******************************** functions ********************************/

// helpers (?)
/**
 * Funkcja pomocnicza, zwracająca odpowiedź http 404
 * @param  {[type]} response Obiekt odpowiedzi
 * @return {[type]}
 */
function send404(response) {
    response.writeHead(404, {
        'Content-Type': 'text/plain'
    });
    response.write('Błąd 404: plik nie został znaleziony');
    response.end();
}

/**
 * Funkcja, zwracająca w odpowiedzi pliki statyczne
 * @param  {[type]} response     Obiekt odpowiedzi
 * @param  {[type]} filePath     Ścieżka pliku
 * @param  {[type]} fileContents Zawartość pliku
 * @return {[type]}              [description]
 */
function sendFile(response, filePath, fileContents) {
    response.writeHead(200, {
        'Content-Type': mime.lookup(path.basename(filePath))
    });
    response.end(fileContents);
}

/**
 * Funkcja serwująca pliki statyczne i dodająca je do cache'u w pamięci RAM
 * @param  {[type]} response Obiekt odpowiedzi
 * @param  {[type]} cache    Obiekt cache'u
 * @param  {[type]} absPath  Ścieżka absolutna do pliku
 * @return {[type]}          [description]
 */
function serveStatic(response, cache, absPath) {
    if (cache[absPath]) {
    	sendFile(response, absPath, cache[absPath]);
    } else {
    	fs.exists(absPath, function (exists) {
    		if (exists) {
    			fs.readFile(absPath, function (err, data) {
    				if (err) {
    					send404(response);
    				} else {
    					cache[absPath] = data;
    					sendFile(response, absPath, data);
    				}
    			});
    		} else {
    			send404(response);
    		}
    	});
    }

}