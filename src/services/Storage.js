/**
 * Storage
 */
export class Storage {
  /**
   */
  constructor() {
    this.init()
  }

  /**
   */
  init() {
    const urlParams = new URLSearchParams(window.location.search)
    const symbol = urlParams.get('symbol')
    const timeframe = urlParams.get('timeframe') || '1h'
    const selectedIntervalMilliseconds =
    this.getMillisecondsFromInterval(timeframe)
    const requiredDuration = selectedIntervalMilliseconds * 500 // 500 candles
    let endTime = Math.floor(urlParams.get('endTime')) ||
    (new Date().getTime())
    if (endTime > new Date().getTime()) {
      endTime = new Date().getTime()
    }
    let startTime = Math.floor(urlParams.get('startTime'))||
    (new Date().getTime() - requiredDuration)

    const duration = endTime - startTime
    if (duration < requiredDuration) {
      startTime = endTime - requiredDuration
    }

    this.set({
      watchlistVisible: false,
      watchlist: [
        {
          ticker: symbol,
          price: 0,
        },
      ],
      chart: {
        ticker: symbol,
        interval: timeframe,
        loading: false,
        startTime: startTime,
        endTime: endTime,
      },
    })
  }

  /**
   * @param {String} interval
   * @return {Number}
   */
  getMillisecondsFromInterval(interval) {
    const intervalsMap = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000,
      '1M': 2592000000,
    }
    return intervalsMap[interval]
  }

  /**
   * @return {Object}
   */
  get() {
    return JSON.parse(localStorage.getItem('BINANCE_WATCHER'))
  }

  /**
   * @param {Object} payload
   */
  set(payload) {
    localStorage.setItem(
        'BINANCE_WATCHER',
        JSON.stringify(payload),
    )
  }

  /**
   * @param {Boolean} night
   * @return {Object}
   */
  setNight(night) {
    const localData = this.get()
    localData.night = night
    this.set(localData)

    return localData
  }

  /**
   * @param {Object} ticker
   * @return {Object}
   */
  watchlistAdd(ticker) {
    const localData = this.get()
    localData.watchlist.push(ticker)
    this.set(localData)

    return localData
  }

  /**
   * @param {String} ticker
   * @return {Object}
   */
  watchlistRemove(ticker) {
    const localData = this.get()

    localData.watchlist = localData.watchlist
        .filter((item) => item.ticker !== ticker)

    this.set(localData)

    return localData
  }

  /**
   * @param {Boolean} visibled
   * @return {Object}
   */
  watchlistVisibleSet(visibled) {
    const localData = this.get()

    localData.watchlistVisible = visibled

    this.set(localData)

    return localData
  }

  /**
   * @param {String} ticker
   * @return {Object}
   */
  chartTickerSet(ticker) {
    const localData = this.get()

    localData.chart.ticker = ticker

    this.set(localData)

    return localData
  }

  /**
   * @param {String} interval
   * @return {Object}
   */
  chartIntervalSet(interval) {
    const localData = this.get()

    localData.chart.interval = interval

    this.set(localData)

    return localData
  }
}
