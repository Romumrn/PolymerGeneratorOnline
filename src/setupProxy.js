const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {

    const socketProxy = createProxyMiddleware('/socket', {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        logLevel: 'debug',
    });

    app.use(socketProxy);


    const apiProxy = createProxyMiddleware('/api', {
        target: 'http://localhost:3001',
        changeOrigin: true,
        logLevel: 'debug',
    })

    app.use(apiProxy)
}

   // app.use(
    //     '/socket.io',
    //     createProxyMiddleware('/socket.io',{
    //         "target": "http://localhost:3001",
    //         "ws": true
    //     })
    // )
    // app.use(
    //     '/api',
    //     createProxyMiddleware({
    //         target: 'http://localhost:3001',
    //         changeOrigin: true,
    //     })
    // )


// "/socket.io": {
//     "target": "http://localhost:3001",
//         "ws": true