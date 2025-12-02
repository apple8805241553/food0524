import http from "node:http";
import fs from "node:fs/promises";
import { json } from "node:stream/consumers";

const server = http.createServer(async (req, res) => {
    const jsonString = JSON.stringify(req.headers, null, 4);

    fs.writeFile("./headers.json", jsonString);

    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`<h2>Hello World!</h2>
        
        <p>${req.url}</p>`);
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});