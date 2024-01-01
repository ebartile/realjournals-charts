<script>
import Intervals from '@/components/Intervals'
import ConnectionStatus from '@/components/ConnectionStatus'
import ButtonToggle from '@/components/ButtonToggle'
import {mapState} from 'vuex'

export default {
  name: 'app-bar',
  components: {
    'intervals': Intervals,
    'connection-status': ConnectionStatus,
    'button-toggle': ButtonToggle,
  },
  computed: {
    socketIsConnected() {
      return this.socket.isConnected
    },
    ...mapState([
      'socket',
      'watchlistVisible',
      'chart',
      'night',
    ]),
    isNightMode: {
      get() {
        return this.night
      },
      set(value) {
        this.$vuetify.theme.dark = value
        this.$store.dispatch('setNightMode', value)
      },
    },
  },
}
</script>

<template>
  <div
    :class="{'app-bar': true, 'dark-theme': isNightMode}"
    app
    color=""
    dark>
    <intervals
      class="intervals"
      :intervalSelected="chart.interval"
      @intervalSelect="$store.dispatch('chartIntervalSet', $event)" />

    <div class="right-wrapper">
      <div class="connection-status-bar">
        <span class="night-mode">
          <input type="checkbox" v-model="isNightMode" style='margin:20px'>
          <label>NM</label>
        </span>
      </div>

      <connection-status
        :status="socket.isConnected" />

      <button-toggle
        :pressed="watchlistVisible"
        :text="chart.ticker"
        @toggle="$store.dispatch('watchlistVisibleSet', $event)" />
    </div>
  </div>
</template>

<style lang="scss">
.dark-theme {
  box-shadow:
    0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14),
    0px 1px 10px 0px rgba(0, 0, 0, 0.12);
  background-color: #272727;

  .intervals {
    background-color: #272727 !important;
  }
}

.app-bar {
  padding: 10px 15px;

  display: flex;
  justify-content: space-between;
  width: 100%;

  .intervals {
    overflow-x: scroll;
  }

  .right-wrapper {
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  @media screen and (max-width: 640px) {
    display: flex;
    flex-direction: column;

    .app-bar {
      height: 100px !important;
    }

    .right-wrapper {
      display: flex;
      align-items: center;
      margin-top: 10px;
    }
  }
}
.night-mode {
    top: 17px;
    right: 220px;
    color: #888;
    font: 11px -apple-system,BlinkMacSystemFont,
        Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,
        Fira Sans,Droid Sans,Helvetica Neue,
        sans-serif
}
.night-mode label {
    vertical-align:top;
    line-height: 1.75em;
}
@media only screen and (max-device-width: 480px) {
    .night-mode {
        right: 155px;
    }
    .night-mode label {
        line-height: 2.2em;
    }
}
@media only screen and (max-device-width: 800px) {
    .night-mode {
        top: 14px;
    }
    .night-mode label {
        line-height: 2.2em;
    }
}
</style>
