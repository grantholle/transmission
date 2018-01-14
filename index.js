'use strict'

const axios = require('axios')
const fs = require('fs')
const EventEmitter = require('events')
const async = require('async')
const Buffer = require('safe-buffer').Buffer
const uuid = require('uuid/v4')

class Transmission extends EventEmitter {
  /**
   * Available options:
   * path
   * host
   * port
   * ssl (boolean)
   * username
   * password
   *
   * @param {Object} options
   */
  constructor (options = {}) {
    super()

    const protocol = options.ssl === true ? 'https' : 'http'
    const host = options.host || 'localhost'
    const port = options.port || 9091
    const path = options.url || '/transmission/rpc'

    this.url = `${protocol}://${host}:${port}${path}`
    this.key = null

    if (options.username) {
      this.authHeader = 'Basic ' + new Buffer(options.username + (options.password ? ':' + options.password : '')).toString('base64')
    }

    this.statusArray = ['STOPPED', 'CHECK_WAIT', 'CHECK', 'DOWNLOAD_WAIT', 'DOWNLOAD', 'SEED_WAIT', 'SEED', 'ISOLATED']
    this.status = {}

    this.statusArray.forEach((status, i) => {
      this.status[status] = i
    })

    this.methods = {
      torrents: {
        stop: 'torrent-stop',
        start: 'torrent-start',
        startNow: 'torrent-start-now',
        verify: 'torrent-verify',
        reannounce: 'torrent-reannounce',
        set: 'torrent-set',
        setTypes: {
          'bandwidthPriority': true,
          'downloadLimit': true,
          'downloadLimited': true,
          'files-wanted': true,
          'files-unwanted': true,
          'honorsSessionLimits': true,
          'ids': true,
          'location': true,
          'peer-limit': true,
          'priority-high': true,
          'priority-low': true,
          'priority-normal': true,
          'seedRatioLimit': true,
          'seedRatioMode': true,
          'uploadLimit': true,
          'uploadLimited': true
        },
        add: 'torrent-add',
        addTypes: {
          'download-dir': true,
          'filename': true,
          'metainfo': true,
          'paused': true,
          'peer-limit': true,
          'files-wanted': true,
          'files-unwanted': true,
          'priority-high': true,
          'priority-low': true,
          'priority-normal': true
        },
        rename: 'torrent-rename-path',
        remove: 'torrent-remove',
        removeTypes: {
          'ids': true,
          'delete-local-data': true
        },
        location: 'torrent-set-location',
        locationTypes: {
          'location': true,
          'ids': true,
          'move': true
        },
        get: 'torrent-get',
        fields: ['activityDate', 'addedDate', 'bandwidthPriority', 'comment', 'corruptEver', 'creator', 'dateCreated', 'desiredAvailable', 'doneDate', 'downloadDir', 'downloadedEver', 'downloadLimit', 'downloadLimited', 'error', 'errorString', 'eta', 'files', 'fileStats', 'hashString', 'haveUnchecked', 'haveValid', 'honorsSessionLimits', 'id', 'isFinished', 'isPrivate', 'leftUntilDone', 'magnetLink', 'manualAnnounceTime', 'maxConnectedPeers', 'metadataPercentComplete', 'name', 'peer-limit', 'peers', 'peersConnected', 'peersFrom', 'peersGettingFromUs', 'peersKnown', 'peersSendingToUs', 'percentDone', 'pieces', 'pieceCount', 'pieceSize', 'priorities', 'rateDownload', 'rateUpload', 'recheckProgress', 'seedIdleLimit', 'seedIdleMode', 'seedRatioLimit', 'seedRatioMode', 'sizeWhenDone', 'startDate', 'status', 'trackers', 'trackerStats', 'totalSize', 'torrentFile', 'uploadedEver', 'uploadLimit', 'uploadLimited', 'uploadRatio', 'wanted', 'webseeds', 'webseedsSendingToUs']
      },
      session: {
        stats: 'session-stats',
        get: 'session-get',
        set: 'session-set',
        setTypes: {
          'start-added-torrents': true,
          'alt-speed-down': true,
          'alt-speed-enabled': true,
          'alt-speed-time-begin': true,
          'alt-speed-time-enabled': true,
          'alt-speed-time-end': true,
          'alt-speed-time-day': true,
          'alt-speed-up': true,
          'blocklist-enabled': true,
          'dht-enabled': true,
          'encryption': true,
          'download-dir': true,
          'peer-limit-global': true,
          'peer-limit-per-torrent': true,
          'pex-enabled': true,
          'peer-port': true,
          'peer-port-random-on-start': true,
          'port-forwarding-enabled': true,
          'seedRatioLimit': true,
          'seedRatioLimited': true,
          'speed-limit-down': true,
          'speed-limit-down-enabled': true,
          'speed-limit-up': true,
          'speed-limit-up-enabled': true
        }
      },
      other: {
        blockList: 'blocklist-update',
        port: 'port-test',
        freeSpace: 'free-space'
      }
    }
  }

  /**
   * Makes a call to the Transmission server
   *
   * @param {Object} query The query to send the server
   * @returns {Promise}
   */
  callServer (query) {
    return new Promise((resolve, reject) => {
      const makeRequest = async () => {
        const config = {
          headers: {
            'X-Transmission-Session-Id': this.key || ''
          }
        }

        if (this.authHeader) {
          config.headers.Authorization = this.authHeader
        }

        try {
          const response = await axios.post(this.url, query, config)
          resolve(response.data.arguments)
        } catch (err) {
          if (err.response.status === 409) {
            this.key = err.response.headers['x-transmission-session-id']
            return makeRequest()
          }

          reject(err)
        }
      }

      makeRequest()
    })
  }

  /**
   * Sets torrent properties
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @param {Object} options The options to set on the server
   * @returns {Promise}
   */
  set (ids, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof options !== 'object') {
        return reject(new Error('Arguments mismatch for "bt.set"'))
      }

      ids = Array.isArray(ids) ? ids : [ids]
      const args = { ids }

      for (const key of Object.keys(options)) {
        args[key] = options[key]
      }

      this.callServer({
        arguments: args,
        method: this.methods.torrents.set,
        tag: uuid()
      })
      .then(res => resolve(res))
      .catch(err => reject(err))
    })
  }

  /**
   * An alias for `addUrl()`
   *
   * @param {String} path The magnet url of the torrent
   * @param {Object} options Optional options for the new torrent
   * @returns {Promise}
   */
  add (path, options = {}) {
    return this.addUrl(path, options)
  }

  /**
   * Adds a torrent from a file path to a torrent file
   *
   * @param {String} filePath The local file path to a torrent file
   * @param {Object} options Optional options for the new torrent
   * @returns {Promise}
   */
  addFile (filePath, options = {}) {
    const readFile = () => {
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
          if (err) {
            return reject(err)
          }

          resolve(new Buffer(data).toString('base64'))
        })
      })
    }

    return readFile().then(res => this.addBase64(res, options))
  }

  /**
   * Adds a torrent from the base64 contents of a torrent file
   *
   * @param {String} fileb64 A base64 encoded torrent file
   * @param {Object} options Optional options for the new torrent
   * @returns {Proimse}
   */
  addBase64 (fileb64, options = {}) {
    return this.addTorrentDataSrc({ metainfo: fileb64 }, options)
  }

  /**
   * Adds a torrent from a magnet url
   *
   * @param {String} url The magnet url of the torrent
   * @param {Object} options Optional options for the new torrent
   * @returns {Promise}
   */
  addUrl (url, options = {}) {
    return this.addTorrentDataSrc({ filename: url }, options)
  }

  /**
   * Adds a new torrent from a variety of sources
   *
   * @param {Object} args The data needed to add a new torrent file
   * @param {Object} options Optional options for the new torrent
   * @returns {Promise}
   */
  addTorrentDataSrc (args, options = {}) {
    return new Promise((resolve, reject) => {
      if (typeof options !== 'object') {
        return reject(new Error('Arguments mismatch for "bt.add"'))
      }

      for (const key of Object.keys(options)) {
        args[key] = options[key]
      }

      this.callServer({
        arguments: args,
        method: this.methods.torrents.add,
        tag: uuid()
      }).then(res => {
        const torrent = res['torrent-duplicate'] ? res['torrent-duplicate'] : res['torrent-added']
        resolve(torrent)
      }).catch(err => reject(err))
    })
  }

  /**
   * Removes a torrent from Transmission with the option to delete files as well
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @param {Boolean} deleteLocalData Whether to delete local files
   */
  remove (ids, deleteLocalData = false) {
    const options = {
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids],
        'delete-local-data': deleteLocalData
      },
      method: this.methods.torrents.remove,
      tag: uuid()
    }

    return this.callServer(options)
  }

  /**
   * Move a torrent from one location to another
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @param {String} location The new torrent location
   * @param {Boolean} move If true, move from previous location
   * @returns {Promise}
   */
  move (ids, location, move = false) {
    const options = {
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids],
        location: location,
        move: move
      },
      method: this.methods.torrents.location,
      tag: uuid()
    }

    return this.callServer(options)
  }

  /**
   * Rename a file or folder
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @param {String} path The path to the file or folder that will be renamed, relative to the root torrent folder
   * @param {String} name The file or folder's new name
   * @returns {Promise}
   */
  rename (ids, path, name) {
    const options = {
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids],
        path: path,
        name: name
      },
      method: this.methods.torrents.rename,
      tag: uuid()
    }

    return this.callServer(options)
  }

  /**
   * Get information on a torrent or torrents
   *
   * @param {integer|Array} ids An array of ids, a single id, or nothing for all torrents
   * @param {Array} fields The fields to return from Transmission about the torrent(s)
   * @returns {Promise}
   */
  get (ids, fields = []) {
    if (!Array.isArray(fields)) {
      throw new Error(`The fields parameter must be an array`)
    }

    const options = {
      arguments: {
        fields: fields.length > 0 ? fields : this.methods.torrents.fields,
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.get,
      tag: uuid()
    }

    if (!ids) {
      delete options.arguments.ids
    }

    return this.callServer(options)
  }

  /**
   * Polls the server and waits for the target state
   * STOPPED
   * CHECK_WAIT
   * CHECK
   * DOWNLOAD_WAIT
   * DOWNLOAD
   * SEED_WAIT
   * SEED
   * ISOLATED
   *
   * @param {Integer} id The torrent id
   * @param {String} targetState The state for which to wait
   * @returns {Promise}
   */
  waitForState (id, targetState) {
    let latestState = 'unknown'
    let latestTorrent = null

    return new Promise((resolve, reject) => {
      async.whilst(a => {
        return latestState !== targetState
      }, whilstCb => {
        this.get(id).then(result => {
          const torrent = result.torrents[0]

          if (!torrent) {
            return reject(new Error(`No id (${id}) found for torrent`))
          }

          latestTorrent = torrent
          latestState = this.statusArray[torrent.status]

          if (latestState === targetState) {
            return whilstCb(null, torrent)
          }

          setTimeout(whilstCb, 1000)
        }).catch(whilstCb)
      }, err => {
        if (err) {
          return reject(err)
        }

        resolve(latestTorrent)
      })
    })
  }

  /**
   * Retrieves peer information for the given torrent(s) id
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  peers (ids) {
    return this.get(ids, ['peers', 'hashString', 'id'])
  }

  /**
   * Retrieves file information for the given torrent(s) id
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  files (ids) {
    return this.get(ids, ['files', 'fileStats', 'hashString', 'id'])
  }

  /**
   * Returns time related information for the given torrent(s) id
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  fast (ids) {
    return this.get(ids, ['id', 'error', 'errorString', 'eta', 'isFinished', 'isStalled', 'leftUntilDone', 'metadataPercentComplete', 'peersConnected', 'peersGettingFromUs', 'peersSendingToUs', 'percentDone', 'queuePosition', 'rateDownload', 'rateUpload', 'recheckProgress', 'seedRatioMode', 'seedRatioLimit', 'sizeWhenDone', 'status', 'trackers', 'uploadedEver', 'uploadRatio'])
  }

  /**
   * Stop downloading and seeding the given torrent(s)
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  stop (ids) {
    if (!ids) {
      return this.callServer({ method: this.methods.torrents.stop })
    }

    return this.callServer({
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.stop,
      tag: uuid()
    })
  }

  /**
   * Stops downloading and seeding all torrents
   *
   * @returns {Promise}
   */
  stopAll () {
    return this.stop()
  }

  /**
   * Start downloading and seeding the given torrent(s)
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  start (ids) {
    if (!ids) {
      return this.callServer({ method: this.methods.torrents.start })
    }

    return this.callServer({
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.start,
      tag: uuid()
    })
  }

  /**
   * Starts downloading and seeding all torrents
   *
   * @returns {Promise}
   */
  startAll () {
    return this.start()
  }

  /**
   * Start downloading and seeding the given torrent(s) right now
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  startNow (ids) {
    return this.callServer({
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.startNow,
      tag: uuid()
    })
  }

  /**
   * Verifies currently downloaded pieces
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  verify (ids) {
    return this.callServer({
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.verify,
      tag: uuid()
    })
  }

  /**
   * Reannounce torrent availability
   *
   * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
   * @returns {Promise}
   */
  reannounce (ids) {
    return this.callServer({
      arguments: {
        ids: Array.isArray(ids) ? ids : [ids]
      },
      method: this.methods.torrents.reannounce,
      tag: uuid()
    })
  }

  /**
   * Gets all the fields for all torrents
   * Just syntactic sugar around get()
   *
   * @returns {Promise}
   */
  all () {
    return this.get()
  }

  /**
   * Retrieves all the active torrents
   *
   * @returns {Promise}
   */
  active () {
    return this.callServer({
      arguments: {
        fields: this.methods.torrents.fields,
        ids: 'recently-active'
      },
      method: this.methods.torrents.get,
      tag: uuid()
    })
  }

  /**
   * Gets or sets Transmission session data
   *
   * @param {Object} settings The settings to set for Transmission
   * @returns {Promise}
   */
  session (settings) {
    if (!settings) {
      return this.callServer({
        method: this.methods.session.get,
        tag: uuid()
      })
    }

    if (typeof settings !== 'object') {
      throw new Error('The parameter must be an object')
    }

    for (const key of Object.keys(settings)) {
      if (!this.methods.session.setTypes[key]) {
        throw new Error(`Cant set type ${key}`)
      }
    }

    return this.callServer({
      arguments: settings,
      method: this.methods.session.set,
      tag: uuid()
    })
  }

  /**
   * Gets the session stats
   *
   * @returns {Promise}
   */
  sessionStats () {
    return this.callServer({
      method: this.methods.session.stats,
      tag: uuid()
    })
  }

  /**
   * Checks how much free space is available in a specified folder
   *
   * @param {String} path The path to the folder
   * @returns {Promise}
   */
  freeSpace (path) {
    return this.callServer({
      arguments: { path },
      method: this.methods.other.freeSpace
    })
  }
}

module.exports = Transmission
