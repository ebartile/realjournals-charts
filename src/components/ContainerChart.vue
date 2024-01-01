<script>
import {TradingVue} from 'trading-vue-js'
import Overlays from 'tvjs-overlays'
import {mapState} from 'vuex'
import {BinanceApi} from '@/services/BinanceApi'

const binanceApi = new BinanceApi()
const urlParams = new URLSearchParams(window.location.search)
const timezone = urlParams.get('timezone') ||
        -new Date().getTimezoneOffset() / 60
const toolbarParam = urlParams.get('toolbar')
const toolbar = toolbarParam !== null &&
toolbarParam.toLowerCase() === 'true'

export default {
  name: 'container-chart',
  components: {
    'trading-vue': TradingVue,
  },
  data() {
    return {
      width: null,
      height: null,
      overlays: [Overlays['Histogram']],
      timezone: timezone,
      toolbar: toolbar,
    }
  },
  computed: {
    kline() {
      return {
        ohlcv: this.chart.kline,
        onchart: this.chart.onchart || [],
        offchart: this.chart.offchart || [],
      }
    },
    colors() {
      return this.night ? {
        colorBack: '#212121',
        colorTitle: '#F0B90B',
        colorGrid: '#424242',
        colorCandleUp: '#F0B90B',
        colorCandleDw: '#F57C00',
        colorWickUp: '#F0B90B',
        colorWickDw: '#F57C00',
        colorVolUp: '#9C27B0',
        colorVolDw: '#7B1FA2',
        colorText: '#dedddd',
      } : {
        colorBack: '#fff',
        colorTitle: '#000000',
        colorGrid: '#eee',
        colorText: '#000',
      }
    },
    ...mapState([
      'chart',
      'watchlistVisible',
      'night',
    ]),
  },
  watch: {
    watchlistVisible() {
      this.width = document.getElementById('container-chart').offsetWidth
    },
  },
  destroyed() {
    window.removeEventListener('resize', this.windowResizeHandler)
  },
  mounted() {
    this.width = document.getElementById('container-chart').offsetWidth
    this.height = window.innerHeight - 64 - 24 - 14 - 4

    window.addEventListener('resize', this.windowResizeHandler)
  },
  methods: {
    chartResizeHandler({width, height}) {
      this.width = width
    },
    windowResizeHandler(e) {
      this.height = e.target.innerHeight - 64 - 24 - 14 - 4
    },
    async range_changed(range) {
      // console.log(this.chart.kline)
      const [t1, t2] = range
      if (t1 < 1420070400) return // 2015
      if (this.chart.loading) return
      if (t2 > this.chart.kline[this.chart.kline.length-2][0]) {
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
        const selectedIntervalMilliseconds =
        intervalsMap[this.chart.interval]
        const requiredDuration = selectedIntervalMilliseconds * 500
        const endTime = this.chart.kline[this.chart.kline.length-2][0] +
        requiredDuration
        if (this.chart.kline[this.chart.kline.length-2][0] +
        selectedIntervalMilliseconds >=
        this.chart.kline[this.chart.kline.length-1][0] &&
        this.chart.kline[this.chart.kline.length-2][0] +
        selectedIntervalMilliseconds >=
        new Date().getTime()) {
          this.chart.loading = false
          return
        }
        const startTime = this.chart.kline[this.chart.kline.length-2][0]

        console.log('Loading Right Chart Data from Range:',
            this.chart.kline[this.chart.kline.length-2][0], t2)
        this.chart.loading = true

        const {success, data: kline, message} = await binanceApi.klineGet({
          interval: this.chart.interval,
          symbol: this.chart.ticker,
          startTime: startTime,
          endTime: endTime,
        })

        if (!success) {
          console.log('klineLoad Error', message)
          return
        }

        this.chart.loading = false
        if (this.chart.kline[this.chart.kline.length-1][0] ==
        kline[kline.length-1][0]) {
          kline.pop()
        }
        this.chart.kline.pop()
        this.chart.kline.push(...kline)
      } else if (t1 < this.chart.kline[0][0]) {
        console.log('Loading Left Data Chart from Range:',
            t1, this.chart.kline[0][0])
        this.chart.loading = true
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
        const selectedIntervalMilliseconds =
        intervalsMap[this.chart.interval]
        const requiredDuration = selectedIntervalMilliseconds * 500
        let endTime = this.chart.kline[0][0]
        if (endTime > new Date().getTime()) {
          endTime = new Date().getTime()
        }
        const startTime = endTime - requiredDuration

        const {success, data: kline, message} = await binanceApi.klineGet({
          interval: this.chart.interval,
          symbol: this.chart.ticker,
          startTime: startTime,
          endTime: endTime,
        })

        if (!success) {
          console.log('klineLoad Error', message)
          return
        }

        this.chart.loading = false
        Array.prototype.unshift.apply(this.chart.kline, kline)
      }
    },
  },
}
</script>

<template>
  <v-card id="container-chart">
    <v-card-title style="height: 7px; padding: 0px;" />

    <v-divider />

    <div class="chart">
      <trading-vue
        :data="kline"
        ref="tvjs"
        v-on:range-changed="range_changed"
        :overlays="overlays"
        :timezone="parseInt(timezone)"
        :width="width"
        :height="height"
        :toolbar="toolbar"
        :titleTxt="`${chart.ticker}
        ${chart.interval}`.toUpperCase()"
        :colorBack="colors.colorBack"
        :colorTitle="colors.colorTitle"
        :colorText="colors.colorText"
        :colorGrid="colors.colorGrid"
        :colorCandleUp="colors.colorCandleUp"
        :colorCandleDw="colors.colorCandleDw"
        :colorWickUp="colors.colorWickUp"
        :colorWickDw="colors.colorWickDw"
        :colorVolUp="colors.colorVolUp"
        :colorVolDw="colors.colorVolDw"/>

      <div class="preloader"
        :class="{preloader_showed: !chart.kline.length, 'dark-theme': night}"
        :style="{
          height: height + 'px',
          width: width + 'px',
        }">
        <div class="preloader-wrapper">
          <v-progress-circular :size="70" indeterminate color="amber" />
        </div>
      </div>

      <resize-observer @notify="chartResizeHandler" />
    </div>

    <v-divider />

    <v-card-actions style="height: 7px; padding: 0px;" />
  </v-card>
</template>
<style lang="scss">
.chart {
  position: relative;
}

.preloader {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 100;

  display: flex;
  justify-content: center;
  align-items: center;

  visibility: hidden;
  opacity: 0;
  transition: opacity .5s;
}

.preloader_showed {
  visibility: visible;
  opacity: 1;
}
.dark-theme {
  background-color: #212121;
}
</style>
