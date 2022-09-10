/**
Before running:
> npm install ws
Then:
> node server.js
> open http://localhost:8080 in the browser
*/

const http = require("http");
const fs = require("fs");
const ws = new require("ws");

const wss = new ws.Server({ noServer: true });

const clients = new Set();

function accept(req, res) {
  console.log("Accepting an incoming connection...");

  if (
    req.url == "/ws" &&
    req.headers.upgrade &&
    req.headers.upgrade.toLowerCase() == "websocket" &&
    // can be Connection: keep-alive, Upgrade
    req.headers.connection.match(/\bupgrade\b/i)
  ) {
    console.log("Upgrading connection to websocket");
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), onSocketConnect);
  } else if (req.url == "/") {
    // index.html
    console.log("Returning static page index.html file...");
    fs.createReadStream("./src/index.html").pipe(res);
  } else {
    // page not found
    console.log("Returning classic HTTP 404 NotFound");
    res.writeHead(404);
    res.end();
  }
}

function onSocketConnect(ws) {
  console.log("onSocketConnect: adding a new connected client");
  clients.add(ws);
  log(`new connection`);

  ws.on("message", function (message) {
    console.log("Server side onMessage", message);
    log(`message received: ${message}`);

    message = message.slice(0, 50); // max message length will be 50

    for (let client of clients) {
      client.send(`server echo response: ${message}`);
    }
  });

  ws.on("close", function () {
    console.log("Server side onClose");
    log(`connection closed`);
    clients.delete(ws);
  });
}

let log = console.log;
const port = 443;
console.log("Starting the server, listening on port ", port);
http.createServer(accept).listen(port);
