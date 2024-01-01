import Vue from 'vue'
import Vuex from 'vuex'

import {BinanceApi} from '@/services/BinanceApi'
import {Storage} from '@/services/Storage'

Vue.use(Vuex)

const binanceApi = new BinanceApi()
const storage = new Storage()
const urlParams = new URLSearchParams(window.location.search)
const offchartParams = urlParams.get('offchart') || ''
const offchart = offchartParams ? JSON.parse(offchartParams) : []
const onchartParams = urlParams.get('onchart') || ''
const onchart = onchartParams ? JSON.parse(onchartParams) : []
const nightParam = urlParams.get('night')
const infoVisibleParam = urlParams.get('infoVisible')
const night = nightParam !== null && nightParam.toLowerCase() === 'true'
const infoVisible = infoVisibleParam !== null &&
infoVisibleParam.toLowerCase() === 'true'
const symbol = urlParams.get('symbol')
const timeframe = urlParams.get('timeframe') || '1h'
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
const selectedIntervalMilliseconds = intervalsMap[timeframe]
const requiredDuration = selectedIntervalMilliseconds * 500 // 500 candles
let endTime = Math.floor(urlParams.get('endTime')) || (new Date().getTime())
if (endTime > new Date().getTime()) {
  endTime = new Date().getTime()
}
let startTime = Math.floor(urlParams.get('startTime'))||
(new Date().getTime() - requiredDuration)

const duration = endTime - startTime
if (duration < requiredDuration) {
  startTime = endTime - requiredDuration
}

export default new Vuex.Store({
  state: {
    watchlistVisible: infoVisible,
    watchlist: [],
    tickers: [],
    night: night,
    chart: {
      ticker: symbol,
      kline: [],
      loading: false,
      interval: timeframe,
      onchart: onchart,
      offchart: offchart,
      startTime: startTime,
      endTime: endTime,
    },
    socket: {
      isConnected: false,
      isReconnect: false,
      reconnectError: false,
    },
  },
  getters: {},
  mutations: {
    SOCKET_ONOPEN(state, event) {
      // Vue.prototype.$socket = event.currentTarget
      state.socket.isConnected = true
      state.socket.isReconnect = false
      state.socket.reconnectError = false

      console.log('SOCKET_ONOPEN')
    },
    SOCKET_ONMESSAGE(state, payload) {
      const {stream, data} = payload

      const isStreamAggTrade = stream && stream.indexOf('aggTrade') > -1
      const isStreamKline = stream && stream.indexOf('kline') > -1

      if (isStreamAggTrade) {
        const {
          s: ticker,
          p: price,
        } = data

        // console.log('aggTrade', ticker, price)

        if (!price || !ticker) return

        state.watchlist.map((item) => {
          if (ticker.toLowerCase() === item.ticker) {
            const isUSD = item.ticker.indexOf('usd') > 1

            if (isUSD) item.price = Number(price).toFixed(2)
            else item.price = price
          }
        })

        return
      } else if (isStreamKline) {
        const {ticker, kline} = state.chart

        const isCurrentTicker = ticker === data.k.s.toLowerCase()
        const skipUpdate = !kline.length || !isCurrentTicker

        if (skipUpdate) return

        const {
          t: openTime,
          o: open,
          h: high,
          l: low,
          c: close,
          v: volume,
        } = data.k

        const newKline = [
          openTime,
          Number(open),
          Number(high),
          Number(low),
          Number(close),
          Number(volume),
        ]

        const needAdd = (
          kline[kline.length - 1][0] < openTime
        )

        const needUpdate = (
          kline[kline.length - 1][0] === openTime
        )

        if (needAdd) {
          kline.push(newKline)
        } else if (needUpdate) {
          kline.pop()
          kline.push(newKline)
        }

        return
      }

      console.log('SOCKET_ONMESSAGE', payload)
    },
    SOCKET_ONERROR(state, event) {
      console.error('SOCKET_ONERROR', state, event)
    },
    SOCKET_ONCLOSE(state) {
      state.socket.isConnected = false
      state.socket.reconnectError = false

      console.log('SOCKET_ONCLOSE')
    },
    SOCKET_RECONNECT(state) {
      state.socket.isReconnect = true
      console.log('SOCKET_RECONNECT')
    },
    SOCKET_RECONNECT_ERROR(state) {
      state.socket.reconnectError = true
    },
    nightSet(state, night) {
      state.night = night
    },
    tickersSet(state, tickers) {
      state.tickers = tickers
    },
    watchlistVisibleSet(state, watchlistVisible) {
      state.watchlistVisible = watchlistVisible
    },
    watchlistSet(state, watchlist) {
      state.watchlist = watchlist
    },
    watchlistAdd(state, watchlistItem) {
      state.watchlist.push(watchlistItem)
    },
    watchlistRemove(state, ticker) {
      state.watchlist = state.watchlist.filter(
          (item) => item.ticker !== ticker,
      )
    },
    chartTickerSet(state, ticker) {
      state.chart.ticker = ticker
    },
    chartKlineSet(state, kline) {
      state.chart.kline = kline
    },
    chartKlineLeftSet(state, kline) {
      state.chart.kline = [...kline, ...state.chart.kline]
    },
    chartKlineRightSet(state, kline) {
      state.chart.kline = [...state.chart.kline, ...kline]
    },
    chartIntervalSet(state, interval) {
      state.chart.interval = interval
    },
  },
  actions: {
    async tickersLoad({commit}) {
      const {
        success,
        tickers,
        message,
      } = await binanceApi.tickersGet()

      if (!success) {
        console.log(message)
        return false
      }

      commit('tickersSet', tickers)
    },

    async chartKlineLoad({commit, state}) {
      const {chart} = state

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
      const selectedIntervalMilliseconds = intervalsMap[chart.interval]
      const requiredDuration = selectedIntervalMilliseconds * 500 // 500 candles
      let endTime = chart.endTime || (new Date().getTime())
      if (endTime > new Date().getTime()) {
        endTime = new Date().getTime()
      }
      let startTime = chart.startTime ||
      (new Date().getTime() - requiredDuration)

      const duration = endTime - startTime
      if (duration < requiredDuration) {
        startTime = endTime - requiredDuration
      }

      const {success, data: kline, message} = await binanceApi.klineGet({
        interval: chart.interval,
        symbol: chart.ticker,
        startTime: startTime,
        endTime: endTime,
      })

      if (!success) {
        console.log('klineLoad Error', message)
        return
      }

      commit('chartKlineSet', kline)
    },

    appLocalDataInit({commit}) {
      const {
        watchlist,
        watchlistVisible,
        chart: {
          ticker,
          interval,
        },
      } = storage.get()

      commit('watchlistVisibleSet', watchlistVisible)
      commit('watchlistSet', watchlist)
      commit('chartTickerSet', ticker)
      commit('chartIntervalSet', interval)
    },

    streamsInitSubscribe({state}) {
      const {watchlist, chart} = state

      if (watchlist.length) binanceApi.watchlistSubscribe(watchlist)
      if (chart.ticker) binanceApi.klineSubscribe(chart.ticker, chart.interval)
    },

    watchlistVisibleSet({commit, state}, visibled) {
      commit('watchlistVisibleSet', visibled)
      storage.watchlistVisibleSet(visibled)

      const {watchlist} = state

      if (watchlist.length) {
        if (visibled) binanceApi.watchlistSubscribe(watchlist)
        else binanceApi.watchlistUnsubscribe(watchlist)
      }
    },

    setNightMode({commit}, night) {
      commit('nightSet', night)
      storage.setNight(night)
    },

    watchlistAdd({commit}, ticker) {
      binanceApi.watchlistAdd(ticker)

      const newTicker = {
        ticker,
        price: null,
      }

      commit('watchlistAdd', newTicker)
      storage.watchlistAdd(newTicker)
    },

    watchlistRemove({commit}, ticker) {
      binanceApi.watchlistRemove(ticker)

      commit('watchlistRemove', ticker)
      storage.watchlistRemove(ticker)
    },

    async chartTickerSet({commit, state}, tickerSeletced) {
      console.log('set')
      const {ticker, interval} = state.chart

      if (ticker === tickerSeletced) return

      binanceApi.klineUnsubscribe(ticker, interval)

      commit('chartTickerSet', tickerSeletced)
      commit('chartKlineSet', [])

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
      const selectedIntervalMilliseconds = intervalsMap[state.chart.interval]
      const requiredDuration = selectedIntervalMilliseconds * 500 // 500 candles
      let endTime = state.chart.endTime || (new Date().getTime())
      if (endTime > new Date().getTime()) {
        endTime = new Date().getTime()
      }
      let startTime = state.chart.startTime ||
      (new Date().getTime() - requiredDuration)

      const duration = endTime - startTime
      if (duration < requiredDuration) {
        startTime = endTime - requiredDuration
      }

      const {
        success,
        data: kline,
        message,
      } = await binanceApi.klineGet({
        interval,
        symbol: tickerSeletced,
        startTime: startTime,
        endTime: endTime,
      })

      if (!success) {
        console.log('localDataInit Error', message)
        return
      }

      commit('chartKlineSet', kline)
      storage.chartTickerSet(tickerSeletced)

      binanceApi.klineSubscribe(tickerSeletced, interval)
    },

    async chartIntervalSet({commit, state}, intervalSelected) {
      const {ticker, interval} = state.chart

      if (intervalSelected === interval) return

      binanceApi.klineUnsubscribe(ticker, interval)

      commit('chartIntervalSet', intervalSelected)
      commit('chartKlineSet', [])

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
      const selectedIntervalMilliseconds = intervalsMap[intervalSelected]
      const requiredDuration = selectedIntervalMilliseconds * 500 // 500 candles
      let endTime = state.chart.endTime || (new Date().getTime())
      if (endTime > new Date().getTime()) {
        endTime = new Date().getTime()
      }
      let startTime = state.chart.startTime ||
      (new Date().getTime() - requiredDuration)

      const duration = endTime - startTime
      console.log('duration', duration)
      console.log('requiredDuration', requiredDuration)
      if (duration < requiredDuration) {
        startTime = endTime - requiredDuration
      }

      const {success, data: kline, message} = await binanceApi.klineGet({
        interval: intervalSelected,
        symbol: ticker,
        startTime: startTime,
        endTime: endTime,
      })

      if (!success) {
        console.log('intervalSelect Error', message)
        return
      }

      commit('chartKlineSet', kline)
      storage.chartIntervalSet(intervalSelected)

      binanceApi.klineSubscribe(ticker, intervalSelected)
    },
  },
  modules: {},
})
