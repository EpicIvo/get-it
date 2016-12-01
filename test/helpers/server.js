/* eslint-disable complexity */
const url = require('url')
const http = require('http')
const zlib = require('zlib')
const simpleConcat = require('simple-concat')
const debugRequest = require('./debugRequest')

const port = 9876
const responses = {
  plainText: 'Just some plain text for you to consume'
}

const responseHandler = (req, res, next) => {
  const parts = url.parse(req.url, true)
  const atMaxRedirects = parts.query.n >= 10

  switch (parts.pathname) {
    case '/req-test/query-string':
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(parts.query))
      break
    case '/req-test/plain-text':
      res.setHeader('Content-Type', 'text/plain')
      res.end(responses.plainText)
      break
    case '/req-test/json':
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({foo: 'bar'}))
      break
    case '/req-test/json-echo':
      res.setHeader('Content-Type', 'application/json')
      req.pipe(res)
      break
    case '/req-test/debug':
      res.setHeader('Content-Type', 'application/json')
      simpleConcat(req, (unused, body) => {
        res.end(JSON.stringify(debugRequest(req, body)))
      })
      break
    case '/req-test/gzip':
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Encoding', 'gzip')
      zlib.gzip(
        JSON.stringify(['harder', 'better', 'faster', 'stronger']),
        (unused, result) => res.end(result)
      )
      break
    case '/req-test/headers':
      res.setHeader('X-Custom-Header', 'supercustom')
      res.setHeader('Content-Type', 'text/markdown')
      res.end('# Memorable tweets\n\n> they\'re good dogs Brent')
      break
    case '/req-test/redirect':
      res.statusCode = atMaxRedirects ? 200 : 302
      res.setHeader(
        atMaxRedirects ? 'Content-Type' : 'Location',
        atMaxRedirects ? 'text/plain' : `/req-test/redirect?n=${Number(parts.query.n) + 1}`
      )
      res.end(atMaxRedirects ? 'Done redirecting' : '')
      break
    case '/req-test/status':
      res.statusCode = Number(parts.query.code || 200)
      res.end('---')
      break
    default:
      if (next) {
        next()
        return
      }

      res.statusCode = 404
      res.end('File not found')
  }
}

const createServer = () => {
  const server = http.createServer(responseHandler)
  return new Promise((resolve, reject) => {
    server.listen(port, () => resolve(server))
  })
}

createServer.port = port
createServer.responses = responses
createServer.responseHandler = responseHandler
createServer.responseHandlerFactory = function () {
  return responseHandler
}

module.exports = createServer
