export = Transmission;
declare const Transmission_base: any;
declare class Transmission extends Transmission_base {
    [x: string]: any;
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
    constructor(options?: Object);
    url: string;
    key: any;
    authHeader: string;
    statusArray: string[];
    status: {
      STOPPED: 0;
      CHECK_WAIT: 1;
      CHECK: 2;
      DOWNLOAD_WAIT: 3;
      DOWNLOAD: 4;
      SEED_WAIT: 5;
      SEED: 6;
      ISOLATED: 7;
    };
    methods: {
        torrents: {
            stop: string;
            start: string;
            startNow: string;
            verify: string;
            reannounce: string;
            set: string;
            setTypes: {
                bandwidthPriority: boolean;
                downloadLimit: boolean;
                downloadLimited: boolean;
                'files-wanted': boolean;
                'files-unwanted': boolean;
                honorsSessionLimits: boolean;
                ids: boolean;
                location: boolean;
                'peer-limit': boolean;
                'priority-high': boolean;
                'priority-low': boolean;
                'priority-normal': boolean;
                seedRatioLimit: boolean;
                seedRatioMode: boolean;
                uploadLimit: boolean;
                uploadLimited: boolean;
            };
            add: string;
            addTypes: {
                'download-dir': boolean;
                filename: boolean;
                metainfo: boolean;
                paused: boolean;
                'peer-limit': boolean;
                'files-wanted': boolean;
                'files-unwanted': boolean;
                'priority-high': boolean;
                'priority-low': boolean;
                'priority-normal': boolean;
            };
            rename: string;
            remove: string;
            removeTypes: {
                ids: boolean;
                'delete-local-data': boolean;
            };
            location: string;
            locationTypes: {
                location: boolean;
                ids: boolean;
                move: boolean;
            };
            get: string;
            fields: string[];
        };
        session: {
            stats: string;
            get: string;
            set: string;
            setTypes: {
                'start-added-torrents': boolean;
                'alt-speed-down': boolean;
                'alt-speed-enabled': boolean;
                'alt-speed-time-begin': boolean;
                'alt-speed-time-enabled': boolean;
                'alt-speed-time-end': boolean;
                'alt-speed-time-day': boolean;
                'alt-speed-up': boolean;
                'blocklist-enabled': boolean;
                'dht-enabled': boolean;
                encryption: boolean;
                'download-dir': boolean;
                'peer-limit-global': boolean;
                'peer-limit-per-torrent': boolean;
                'pex-enabled': boolean;
                'peer-port': boolean;
                'peer-port-random-on-start': boolean;
                'port-forwarding-enabled': boolean;
                seedRatioLimit: boolean;
                seedRatioLimited: boolean;
                'speed-limit-down': boolean;
                'speed-limit-down-enabled': boolean;
                'speed-limit-up': boolean;
                'speed-limit-up-enabled': boolean;
                'script-torrent-done-enabled': boolean;
                'script-torrent-done-filename': boolean;
            };
        };
        other: {
            blockList: string;
            port: string;
            freeSpace: string;
        };
    };
    /**
     * Makes a call to the Transmission server
     *
     * @param {Object} query The query to send the server
     * @returns {Promise}
     */
    callServer(query: Object): Promise<any>;
    /**
     * Sets torrent properties
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @param {Object} options The options to set on the server
     * @returns {Promise}
     */
    set(ids: any, options?: Object): Promise<any>;
    /**
     * An alias for `addUrl()`
     *
     * @param {String} path The magnet url of the torrent
     * @param {Object} options Optional options for the new torrent
     * @returns {Promise}
     */
    add(path: string, options?: Object): Promise<any>;
    /**
     * Adds a torrent from a file path to a torrent file
     *
     * @param {String} filePath The local file path to a torrent file
     * @param {Object} options Optional options for the new torrent
     * @returns {Promise}
     */
    addFile(filePath: string, options?: Object): Promise<any>;
    /**
     * Adds a torrent from the base64 contents of a torrent file
     *
     * @param {String} fileb64 A base64 encoded torrent file
     * @param {Object} options Optional options for the new torrent
     * @returns {Proimse}
     */
    addBase64(fileb64: string, options?: Object): any;
    /**
     * Adds a torrent from a magnet url
     *
     * @param {String} url The magnet url of the torrent
     * @param {Object} options Optional options for the new torrent
     * @returns {Promise}
     */
    addUrl(url: string, options?: Object): Promise<any>;
    /**
     * Adds a new torrent from a variety of sources
     *
     * @param {Object} args The data needed to add a new torrent file
     * @param {Object} options Optional options for the new torrent
     * @returns {Promise}
     */
    addTorrentDataSrc(args: Object, options?: Object): Promise<any>;
    /**
     * Removes a torrent from Transmission with the option to delete files as well
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @param {Boolean} deleteLocalData Whether to delete local files
     */
    remove(ids: any, deleteLocalData?: boolean): Promise<any>;
    /**
     * Move a torrent from one location to another
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @param {String} location The new torrent location
     * @param {Boolean} move If true, move from previous location
     * @returns {Promise}
     */
    move(ids: any, location: string, move?: boolean): Promise<any>;
    /**
     * Rename a file or folder
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @param {String} path The path to the file or folder that will be renamed, relative to the root torrent folder
     * @param {String} name The file or folder"s new name
     * @returns {Promise}
     */
    rename(ids: any, path: string, name: string): Promise<any>;
    /**
     * Get information on a torrent or torrents
     *
     * @param {integer|Array} ids An array of ids, a single id, or nothing for all torrents
     * @param {Array} fields The fields to return from Transmission about the torrent(s)
     * @returns {Promise}
     */
    get(ids: any, fields?: any[], ...args: any[]): Promise<any>;
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
    waitForState(id: any, targetState: string): Promise<any>;
    /**
     * Retrieves peer information for the given torrent(s) id
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    peers(ids: any): Promise<any>;
    /**
     * Retrieves file information for the given torrent(s) id
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    files(ids: any): Promise<any>;
    /**
     * Returns time related information for the given torrent(s) id
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    fast(ids: any): Promise<any>;
    /**
     * Stop downloading and seeding the given torrent(s)
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    stop(ids: any): Promise<any>;
    /**
     * Stops downloading and seeding all torrents
     *
     * @returns {Promise}
     */
    stopAll(): Promise<any>;
    /**
     * Start downloading and seeding the given torrent(s)
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    start(ids: any): Promise<any>;
    /**
     * Starts downloading and seeding all torrents
     *
     * @returns {Promise}
     */
    startAll(): Promise<any>;
    /**
     * Start downloading and seeding the given torrent(s) right now
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    startNow(ids: any): Promise<any>;
    /**
     * Verifies currently downloaded pieces
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    verify(ids: any): Promise<any>;
    /**
     * Reannounce torrent availability
     *
     * @param {integer|Array} ids An array of ids or just a single id of the torrent file(s)
     * @returns {Promise}
     */
    reannounce(ids: any): Promise<any>;
    /**
     * Gets all the fields for all torrents
     * Just syntactic sugar around get()
     *
     * @returns {Promise}
     */
    all(): Promise<any>;
    /**
     * Retrieves all the active torrents
     *
     * @returns {Promise}
     */
    active(): Promise<any>;
    /**
     * Gets or sets Transmission session data
     *
     * @param {Object} settings The settings to set for Transmission
     * @returns {Promise}
     */
    session(settings: Object): Promise<any>;
    /**
     * Gets the session stats
     *
     * @returns {Promise}
     */
    sessionStats(): Promise<any>;
    /**
     * Checks how much free space is available in a specified folder
     *
     * @param {String} path The path to the folder
     * @returns {Promise}
     */
    freeSpace(path: string): Promise<any>;
}
