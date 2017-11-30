# transmission-promise

A transmission-daemon wrapper using promises.

This was adapted from FLYBYME's [node-transmission](https://github.com/FLYBYME/node-transmission) (`transmission` package on npm). It contains the same functionality, but is an es6 class and it uses promises instead of callbacks.

## Installation

```sh
npm i --save transmission-promise
```

## Initialization

```js
const Transmission = require('transmission-promise')
const transmission = new Transmission({
  host: 'localhost', // default 'localhost'
  port: 9091, // default 9091
  username: 'username', // default blank
  password: 'password', // default blank
  ssl: true, // default false use https
  url: '/my/other/url', // default '/transmission/rpc'
})
```

## Definition

### Status

RPC returns torrent status with an integer from `0` to `7`.

Use `transmission.status` to check the status with a human-readable variable.

```js
transmission.status = {
  STOPPED       : 0,  // Torrent is stopped
  CHECK_WAIT    : 1,  // Queued to check files
  CHECK         : 2,  // Checking files
  DOWNLOAD_WAIT : 3,  // Queued to download
  DOWNLOAD      : 4,  // Downloading
  SEED_WAIT     : 5,  // Queued to seed
  SEED          : 6,  // Seeding
  ISOLATED      : 7   // Torrent can't find peers
}
```

## Functions

Functions that has an `ids` parameter can be passed either a single integer or an array of integers.

The `add` functions take a second `options` parameter that would be the arguments passed to Transmission. For example, if you want to set the download directory of the torrent you would pass in `"download-dir": "/my/path"`. See the [rpc-spec](https://gist.github.com/RobertAudi/807ec699037542646584) for more information.

~~~
option key           | value type & description
---------------------+-------------------------------------------------
"cookies"            | string      pointer to a string of one or more cookies.
"download-dir"       | string      path to download the torrent to
"filename"           | string      filename or URL of the .torrent file
"metainfo"           | string      base64-encoded .torrent content
"paused"             | boolean     if true, don't start the torrent
"peer-limit"         | number      maximum number of peers
"bandwidthPriority"  | number      torrent's bandwidth tr_priority_t
"files-wanted"       | array       indices of file(s) to download
"files-unwanted"     | array       indices of file(s) to not download
"priority-high"      | array       indices of high-priority file(s)
"priority-low"       | array       indices of low-priority file(s)
"priority-normal"    | array       indices of normal-priority file(s)
~~~

### `addFile(filePath, options = {})`

Add torrents to Transmission using a torrent file.

```js
// With just the path
transmission.addFile('path').then(res => ...)

// Include additional options
transmission.addFile('path', {
	'download-dir': '/a/path/different/than/my/settings'
}).then(res => ...)
```

### `addUrl(url, options = {})`

_Alias: `add()`_

Add torrents to Transmission via a magnet link or a url to a torrent file.

```js
transmission.addUrl('url').then(res => ...)

transmission.add('url', options).then(res => ...)
```

### `addBase64(string, options = {})`

Adds a torrent with a base64 encoded string of a torrent file contents.

```js
transmission.addBase64(myString, options).then(res => ...)
```

### `set(ids)`

Set a torrent's properties. See the [spec](https://gist.github.com/RobertAudi/807ec699037542646584#32-torrent-mutators) for valid options.

```js
transmission.set(id, options).then(() => ...)
```

You must provide one or more ids. According to the spec, transmission will not respond with a success argument, only an error.


### `remove(ids, deleteLocalData = false)`

Remove torrents. Remove local data by passing true as the second argument.

```js
// Removes the torrent, but keeps local data
transmission.remove(ids).then(res => ...)

// Removes the torrent and downloaded data
transmission.remove(ids, true).then(res => ...)
```

### `active()`

List of active torrents.

```js
transmission.active().then(res => ...)
```

### `get(ids, fields = [])`

Gets torrent information. If `ids` is falsy, it will get all the torrents. The `fields` array is the desired fields from the [spec](https://gist.github.com/RobertAudi/807ec699037542646584#33-torrent-accessors). By default it will be retrieve all fields.

```js
// A selection of torrents (one or many)
transmission.get(ids).then(res => {
	for (const torrent of res.torrents) {
		//
	}
})

// All torrents and only the upload ratio
transmission.get(false, ['uploadRatio']).then(res => {
	for (const torrent of res.torrents) {
		// torrent.uploadRatio
	}
})

// Get all torrents and remove it if status is stopped.
transmission.get().then(res => {
	for (const torrent of res.torrents) {
		if (torrent.status === transmission.status.STOPPED) {
			transmission.remove(torrent.id).then(() => {
				console.log(`${torrent.name} removed!`)
			})
		}
	}
}).catch(err => console.error(err))
```

### `waitForState(id, targetState)`

Polls the server and waits for the target state.

State options: `STOPPED`, `CHECK_WAIT`, `CHECK`, `DOWNLOAD_WAIT`, `DOWNLOAD`, `SEED_WAIT`, `SEED`, `ISOLATED`

```js
transmission.waitForState(id, 'DOWNLOAD').then(res => {
	// Torrent is downloading!
})
```

### `stop(ids)`

Stop working torrents.

```js
// Stops a selection of torrents
transmission.stop(ids).then(res => ...)

// Stops all torrents
transmission.stop().then(res => ...)
// or
transmission.stopAll().then(res => ...)
```

### `start(ids)`

Start working torrents.

```js
// Starts a selection of torrents
transmission.start(ids).then(res => ...)

// Starts all torrents
transmission.start().then(res => ...)
// or
transmission.startAll().then(res => ...)
```

### `startNow(ids)`

Bypass the download queue, start working torrents immediately.

```js
transmission.startNow(ids).then(res => ...)
```

### `verify(ids)`

Verify torrent data.

```js
transmission.verify(id).then(res => ...)
```

### `rename(ids, path, name)`

Renames a file or folder in a torrent. The `path` argument is the current relative file path that you get from the file information of `get()`, and `name` is the new name.

```js
// Get the file information first
transmission.get(id, ['files']).then(res => {
	// Assume it's just one torrent...
	const torrent = res.torrents[0]

	// Iterate over the files
	// Renames all the files to something new
	for (const file of torrent.files) {
		const newName = makeNewName()

		transmission.rename(torrent.id, file.name, newName)
	}

	// Changes the torrent directory name
	const p = require('path')
	const directory = p.dirname(torrent.files[0])

	transmission.rename(torrent.id, directory, makeNewName())
})
```

### `reannounce(ids)`

Reannounce to the tracker, ask for more peers.

```js
transmission.reannounce(ids).then(res => ...)
```

###

### `session()`

Get client session infomation.

```js
transmission.session().then(res => ...)
```

### `session(options)`

Set session infomation. See the [spec](https://gist.github.com/RobertAudi/807ec699037542646584#41-session-arguments) for possible options.

```js
transmission.session({ 'download-dir':'/my/path' }).then(res => ...)
```

### `sessionStats(callback)`

Get client session stats. See the [spec](https://gist.github.com/RobertAudi/807ec699037542646584#42-session-statistics) for results.

```js
transmission.sessionStat().then(res => ...)
```

### `freeSpace(path)`

Get free space available on the server for the specified directory.

```js
transmission.freeSpace(path).then(res => ...)
```

## License

MIT
