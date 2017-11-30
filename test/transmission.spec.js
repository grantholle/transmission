/* global describe it afterEach */
const fs = require('fs')
const path = require('path')
const http = require('http')
const async = require('async')
const dotenv = require('dotenv')

dotenv.load()

if (!fs.existsSync(path.resolve('tmp'))) {
  fs.mkdirSync(path.resolve('tmp'))
}

const Transmission = require('../')
const clientOptions = {}

if (process.env.PORT) {
  clientOptions.port = process.env.PORT
}
if (process.env.HOST) {
  clientOptions.host = process.env.HOST
}

// USERNAME and USER aren't overwritten by .env file and are used from the parent process
if (process.env.USERN) {
  clientOptions.username = process.env.USERN
}
if (process.env.PASSWORD) {
  clientOptions.password = process.env.PASSWORD
}
if (process.env.URL) {
  clientOptions.url = process.env.URL
}

describe('transmission', () => {
  const chai = require('chai')
  const expect = chai.expect
  let transmission

  const sampleUrl = 'http://releases.ubuntu.com/16.04/ubuntu-16.04.3-desktop-amd64.iso.torrent'
  const sampleHash = '1488d454915d860529903b61adb537012a0fe7c8'

  chai.config.includeStack = true

  afterEach(done => {
    transmission.get().then(res => {
      async.each(res.torrents, (torrent, callback) => {
        if (torrent.hashString !== sampleHash) {
          return callback()
        }

        transmission.remove(torrent.id, true).then(() => done())
      }, err => {
        done(err)
      })
    })
  })

  it('can instantiate a new instance', done => {
    try {
      transmission = new Transmission(clientOptions)
      done()
    } catch (err) {
      done(err)
    }
  })

  describe('status definition', () => {
    it('should have correct status', () => {
      expect(transmission.status.STOPPED).to.equal(0)
      expect(transmission.status.CHECK_WAIT).to.equal(1)
      expect(transmission.status.CHECK).to.equal(2)
      expect(transmission.status.DOWNLOAD_WAIT).to.equal(3)
      expect(transmission.status.DOWNLOAD).to.equal(4)
      expect(transmission.status.SEED_WAIT).to.equal(5)
      expect(transmission.status.SEED).to.equal(6)
      expect(transmission.status.ISOLATED).to.equal(7)
    })
  })

  describe('methods', function () {
    this.timeout(30000)

    it.skip('should set properties', done => {
      done()
    })

    it('should get all torrents', done => {
      transmission.get().then(res => {
        expect(res.torrents).to.be.an('array')
        done()
      }).catch(done)
    })

    it('should get all active torrents', done => {
      transmission.active().then(res => {
        expect(res.torrents).to.be.an('array')
        done()
      }).catch(done)
    })

    it('should add torrent from file path', done => {
      http.get(sampleUrl, response => {
        const destination = path.resolve('tmp', 'debian.torrent')
        const writeStream = fs.createWriteStream(destination)

        response.pipe(writeStream)
        response.on('error', done)
        response.on('end', () => {
          transmission.addFile(destination).then(info => {
            return transmission.get(info.id)
          }).then(got => {
            if (got.torrents.length === 0) {
              return done(new Error('add torrent failure'))
            }

            done()
          }).catch(done)
        })
      })
    })

    it('should add torrent from url', function (done) {
      transmission.addUrl(sampleUrl).then(info => {
        return transmission.get(info.id)
      }).then(got => {
        if (got.torrents.length === 0) {
          done(new Error('add torrent failure'))
        }

        done()
      }).catch(done)
    })

    it('should rename the torrent', function (done) {
      const newName = 'windows-10-installer.exe'
      const path = 'ubuntu-16.04.3-desktop-amd64.iso'

      transmission.addUrl(sampleUrl).then(info => {
        return transmission.rename(info.id, path, newName)
      }).then(info => {
        return transmission.get(info.id)
      }).then(got => {
        if (newName !== got.torrents[0].name) {
          done(new Error('rename torrent failure'))
        }

        done()
      }).catch(done)
    })

    it('should stop all torrents', done => {
      transmission.addUrl(sampleUrl).then(info => {
        return transmission.waitForState(info.id, 'DOWNLOAD')
      }).then(info => {
        return transmission.stopAll()
      }).then(info => {
        setTimeout(() => {
          transmission.get().then(got => {
            async.each(got.torrents, (torrent, callback) => {
              if (torrent.status !== transmission.status.STOPPED) {
                callback(new Error('Stop torrent failure'))
              }

              callback()
            }, err => {
              if (err) {
                return done(err)
              }

              done()
            })
          }).catch(done)
        }, 2000)
      }).catch(done)
    })

    it('should stop a torrent', done => {
      let id

      transmission.addUrl(sampleUrl).then(info => {
        return transmission.waitForState(id, 'DOWNLOAD')
      }).then(info => {
        return transmission.stopAll(id)
      }).then(info => {
        setTimeout(() => {
          transmission.get(id).then(got => {
            if (got.torrents[0].status !== transmission.status.STOPPED) {
              done(new Error('Stop torrent failure'))
            }

            done()
          }).catch(done)
        }, 2000)
      }).catch(done)
    })

    it.skip('should start working torrents', function () {
            // transmission.start
    })

    it.skip('should start working torrents immediately', function () {
            // transmission.startNow
    })

    it.skip('should reannounce to the tracker', function () {
            // transmission.verify
    })

    it.skip('should set client session info', function () {
            // transmission.session
    })

    it('should get client session info', done => {
      transmission.session().then(res => {
        expect(res).to.have.property('config-dir')
        expect(res).to.have.property('peer-port')
        expect(res).to.have.property('download-dir')
        done()
      }).catch(done)
    })

    it('should get client session stats', done => {
      transmission.sessionStats().then(res => {
        expect(res).to.have.property('downloadSpeed')
        expect(res).to.have.property('uploadSpeed')
        expect(res).to.have.property('torrentCount')
        done()
      }).catch(done)
    })
  })
})
