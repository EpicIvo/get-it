const {httpErrors} = require('../src/middleware')
const requester = require('../src/index')
const {expectRequest, expect, baseUrl, baseUrlPrefix} = require('./helpers')

describe('errors', () => {
  it('should not respond with errors on HTTP >= 400 by default', () => {
    const request = requester([baseUrl])
    const req = request({url: '/status?code=400'})
    return expectRequest(req).to.eventually.have.property('statusCode', 400)
  })

  it('should error when httpErrors middleware is enabled and response code is >= 400', done => {
    const request = requester([baseUrl, httpErrors()])
    const req = request({url: '/status?code=400', headers: {foo: 'bar'}})
    req.response.subscribe(res => {
      throw new Error('Response channel called when error channel should have been triggered')
    })
    req.error.subscribe(err => {
      expect(err).to.be.an.instanceOf(Error)
      expect(err.message).to.eq(
        'GET-request to http://localhost:9980/req-test/status?code=400 resulted in HTTP 400 Bad Request'
      )
      expect(err.message)
        .to.include('HTTP 400')
        .and.include('Bad Request')
      expect(err)
        .to.have.property('response')
        .and.containSubset({
          url: `${baseUrlPrefix}/status?code=400`,
          method: 'GET',
          statusCode: 400,
          statusMessage: 'Bad Request',
          body: '---'
        })

      expect(err)
        .to.have.deep.property('request.headers')
        .and.containSubset({
          foo: 'bar'
        })

      done()
    })
  })

  it('should truncate really long URLs from error message', done => {
    const request = requester([baseUrl, httpErrors()])
    const rep = new Array(1024).join('a')
    const req = request({url: `/status?code=400&foo=${rep}`, headers: {foo: 'bar'}})
    req.response.subscribe(res => {
      throw new Error('Response channel called when error channel should have been triggered')
    })
    req.error.subscribe(err => {
      expect(err).to.be.an.instanceOf(Error)
      expect(err.message).to.have.length.lessThan(600)
      done()
    })
  })

  it('should not error when httpErrors middleware is enabled and response code is < 400', () => {
    const request = requester([baseUrl, httpErrors()])
    const req = request({url: '/plain-text'})
    expectRequest(req).to.eventually.containSubset({
      statusCode: 200,
      body: 'Just some plain text for you to consume'
    })
  })
})
