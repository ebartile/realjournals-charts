<script>
import WatchlistItem from '@/components/WatchListItem'

export default {
  name: 'watchlist',
  components: {
    'watchlist-item': WatchlistItem,
  },
  props: {
    watchlist: Array,
    tickers: Array,
    selectedTicker: String,
  },
}
</script>

<template>
  <v-card>
    <ul
      v-if="watchlist.length"
      class="watchlist">
      <watchlist-item
        v-for="item in watchlist"
        :key="item.ticker"
        :item="item"
        :selectedTicker="selectedTicker"/>
    </ul>
    <div
      v-else
      class="no-items">
      Empty list
    </div>
  </v-card>
</template>

<style lang="scss">
  .watchlist {
    padding-left: 0px !important;
  }

  .no-items {
    padding: 15px;
    color: #616161;
    font-size: 12px;
  }
</style>
