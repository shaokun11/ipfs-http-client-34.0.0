'use strict'

const { Buffer } = require('buffer')
const configure = require('../lib/configure')

module.exports = configure(({ ky }) => {
  return async (topic, data, options) => {
    options = options || {}
    data = Buffer.from(data)

    const searchParams = new URLSearchParams(options.searchParams)
    searchParams.set('arg', topic)

    const res = await ky.post(`pubsub/pub?${searchParams}&arg=${encodeBuffer(data)}`, {
      timeout: options.timeout,
      signal: options.signal,
      headers: options.headers
    }).text()

    return res
  }
})

function encodeBuffer (buf) {
  let uriEncoded = ''
  for (const byte of buf) {
    // https://tools.ietf.org/html/rfc3986#page-14
    // ALPHA (%41-%5A and %61-%7A), DIGIT (%30-%39), hyphen (%2D), period (%2E),
    // underscore (%5F), or tilde (%7E)
    if (
      (byte >= 0x41 && byte <= 0x5A) ||
      (byte >= 0x61 && byte <= 0x7A) ||
      (byte >= 0x30 && byte <= 0x39) ||
      (byte === 0x2D) ||
      (byte === 0x2E) ||
      (byte === 0x5F) ||
      (byte === 0x7E)
    ) {
      uriEncoded += String.fromCharCode(byte)
    } else {
      uriEncoded += `%${byte.toString(16).padStart(2, '0')}`
    }
  }
  return uriEncoded
}
