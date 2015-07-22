/* eslint-env mocha */

var assert = require('assert')

var multer = require('../')
var util = require('./_util')

var express = require('express')
var FormData = require('form-data')
var concat = require('concat-stream')

var port = 34279

describe('Express Integration', function () {
  it('should work with express error handling', function (done) {
    var app = express()
    var limits = { fileSize: 200 }
    var upload = multer({ limits: limits })
    var form = new FormData()

    var routeCalled = 0
    var errorCalled = 0

    form.append('avatar', util.file('small1.dat'))

    app.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('')
    })

    app.use(function (err, req, res, next) {
      assert.equal(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('')
    })

    app.listen(port, function () {
      form.submit('http://localhost:' + port + '/profile', function (err, res) {
        assert.ifError(err)

        res.pipe(concat({ encoding: 'buffer' }, function (body) {
          assert.equal(routeCalled, 0)
          assert.equal(errorCalled, 1)
          assert.equal(body.length, 0)
          assert.equal(res.statusCode, 500)

          done()
        }))
      })
    })
  })
})
