/* eslint-env mocha, browser */
'use strict'

const multiaddr = require('multiaddr')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)

const f = require('./utils/factory')
const ipfsClient = require('../src/index.js')

describe('ipfs-http-client constructor tests', () => {
  describe('parameter permuations', () => {
    it('none', () => {
      const ipfs = ipfsClient()
      if (typeof self !== 'undefined') {
        const { hostname, port } = self.location
        expectConfig(ipfs, { host: hostname, port })
      } else {
        expectConfig(ipfs, {})
      }
    })

    it('opts', () => {
      const host = 'wizard.world'
      const port = '999'
      const protocol = 'https'
      const ipfs = ipfsClient({ host, port, protocol })
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr dns4 string (implicit http)', () => {
      const host = 'foo.com'
      const port = '1001'
      const protocol = 'http' // default to http if not specified in multiaddr
      const addr = `/dns4/${host}/tcp/${port}`
      const ipfs = ipfsClient(addr)
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr dns4 string (explicit https)', () => {
      const host = 'foo.com'
      const port = '1001'
      const protocol = 'https'
      const addr = `/dns4/${host}/tcp/${port}/${protocol}`
      const ipfs = ipfsClient(addr)
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr dns4 string, explicit https in opts', () => {
      const host = 'foo.com'
      const port = '1001'
      const protocol = 'https'
      const addr = `/dns4/${host}/tcp/${port}`
      const ipfs = ipfsClient(addr, { protocol })
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr ipv4 string (implicit http)', () => {
      const host = '101.101.101.101'
      const port = '1001'
      const protocol = 'http'
      const addr = `/ip4/${host}/tcp/${port}`
      const ipfs = ipfsClient(addr)
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr ipv4 string (explicit https)', () => {
      const host = '101.101.101.101'
      const port = '1001'
      const protocol = 'https'
      const addr = `/ip4/${host}/tcp/${port}/${protocol}`
      const ipfs = ipfsClient(addr)
      expectConfig(ipfs, { host, port, protocol })
    })

    it('multiaddr instance', () => {
      const host = 'ace.place'
      const port = '1001'
      const addr = multiaddr(`/dns4/${host}/tcp/${port}`)
      const ipfs = ipfsClient(addr)
      expectConfig(ipfs, { host, port })
    })

    it('host and port strings', () => {
      const host = '1.1.1.1'
      const port = '9999'
      const ipfs = ipfsClient(host, port)
      expectConfig(ipfs, { host, port })
    })

    it('host, port and api path', () => {
      const host = '10.100.100.255'
      const port = '9999'
      const apiPath = '/future/api/v1/'
      const ipfs = ipfsClient(host, port, { 'api-path': apiPath })
      expectConfig(ipfs, { host, port, apiPath })
    })

    it('throws on invalid multiaddr', () => {
      expect(() => ipfsClient('/dns4')).to.throw('invalid address')
      expect(() => ipfsClient('/hello')).to.throw('no protocol with name')
      expect(() => ipfsClient('/dns4/ipfs.io')).to.throw('multiaddr must have a valid format')
    })
  })

  describe('integration', () => {
    let apiAddr
    let ipfsd

    before(function (done) {
      this.timeout(60 * 1000) // slow CI

      f.spawn({ initOptions: { bits: 1024, profile: 'test' } }, (err, node) => {
        expect(err).to.not.exist()
        ipfsd = node
        apiAddr = node.apiAddr.toString()
        done()
      })
    })

    after((done) => {
      if (!ipfsd) return done()
      ipfsd.stop(done)
    })

    it('can connect to an ipfs http api', (done) => {
      clientWorks(ipfsClient(apiAddr), done)
    })
  })
})

function clientWorks (client, done) {
  client.id((err, id) => {
    expect(err).to.not.exist()

    expect(id).to.have.a.property('id')
    expect(id).to.have.a.property('publicKey')
    done()
  })
}

function expectConfig (ipfs, { host, port, protocol, apiPath }) {
  const conf = ipfs.getEndpointConfig()
  expect(conf.host).to.be.oneOf([host, 'localhost', ''])
  expect(conf.port).to.be.oneOf([port, '5001', 80])
  expect(conf.protocol).to.equal(protocol || 'http')
  expect(conf['api-path']).to.equal(apiPath || '/api/v0/')
}
