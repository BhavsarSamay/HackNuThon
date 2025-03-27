const http = require('http')
const app = require('./app')
require('dotenv').config()
const port = process.env.PORT || 5000

console.log('Server started at : ' + port)
const server = http.createServer(app)
server.listen(port)