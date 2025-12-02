import http from "node:http";

const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`<h2>Hello World!</h2>
        
        <p>${req.url}</p>`);
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});