<script>
import {mapState} from 'vuex'
import Watchlist from '@/components/WatchList'

export default {
  name: 'container-watchlist',
  components: {
    'watchlist': Watchlist,
  },
  computed: {
    ...mapState([
      'watchlist',
      'tickers',
      'chart',
    ]),
  },
}
</script>

<template>
  <watchlist
    :watchlist="watchlist"
    :tickers="tickers"
    :selectedTicker="chart.ticker"/>
</template>
