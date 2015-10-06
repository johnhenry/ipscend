var Command = require('ronin').Command
var fs = require('fs')
var path = require('path')
var webshot = require('webshot')
var ipfsAPI = require('ipfs-api')
var open = require('open')

module.exports = Command.extend({
  desc: 'Preview your application through a collection of snapshots',

  options: {
    gen: 'boolean',
    gif: 'boolean'
  },

  run: function (gen, gif, name) {
    try {
      var configPath = path.resolve(process.cwd() + '/ipsurge.json')
      fs.statSync(configPath)
      preview()
    } catch (err) {
      console.log('Project must be initiated first, run `ipsurge init`')
    }

    function preview () {
      var config = JSON.parse(fs.readFileSync(configPath))
      if (config.versions.length === 0) {
        return console.log('You need to publish at least once with <ipsurge publish>')
      }

      if (!gen && !gif) {
        console.log('preview window under dev')
        return open('https://github.com/diasdavid/ipsurge-preview')
      }

      var ipfs = ipfsAPI('localhost', '5001')

      if (gen) {
        var len = config.versions.length
        config.versions.forEach(function (version) {
          if (!version.snapshot) {
            webshot('http://localhost:8080/ipfs/' + version.hash,
                '/tmp/' + version.hash + '.png', function (err) {
              if (err) {
                return console.log(err)
              }

              ipfs.add('/tmp/' + version.hash + '.png', function (err, res) {
                if (err || !res) {
                  return console.error('err', err)
                }
                version.snapshot = res[0].Hash
                len--
                if (len === 0) {
                  var fd = fs.openSync(configPath, 'w')
                  fs.writeSync(fd, JSON.stringify(config, null, '  '), 0, 'utf-8')
                }
              })
            })
          } else {
            len--
          }
        })
      }
    }
  }
})