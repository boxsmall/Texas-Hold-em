<template>
  <div :class="['playing-card', { 'face-down': !faceUp, 'red': isRed }]">
    <div v-if="faceUp && card" class="card-front">
      <div class="card-corner top-left">
        <span class="card-value">{{ card.rank }}</span>
        <span class="card-suit">{{ card.suit }}</span>
      </div>
      <div class="card-center">
        <span class="card-suit-large">{{ card.suit }}</span>
      </div>
      <div class="card-corner bottom-right">
        <span class="card-value">{{ card.rank }}</span>
        <span class="card-suit">{{ card.suit }}</span>
      </div>
    </div>
    <div v-else class="card-back">
      <div class="card-pattern"></div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'PlayingCard',
  props: {
    card: {
      type: Object,
      default: null
    },
    faceUp: {
      type: Boolean,
      default: true
    }
  },
  setup(props) {
    const isRed = computed(() => {
      return props.card?.color === 'red'
    })

    return {
      isRed
    }
  }
}
</script>

<style scoped>
.playing-card {
  width: 70px;
  height: 100px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease;
}

.playing-card:hover {
  transform: translateY(-3px);
}

.playing-card.face-down {
  background: #1a4a7a;
}

.card-front {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #fff 0%, #f0f0f0 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 5px;
}

.playing-card.red .card-front {
  background: linear-gradient(145deg, #fff5f5 0%, #ffe0e0 100%);
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.top-left {
  align-self: flex-start;
}

.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-value {
  font-size: 16px;
  font-weight: bold;
}

.playing-card.red .card-value {
  color: #e94560;
}

.playing-card:not(.red) .card-value {
  color: #1a1a2e;
}

.card-suit {
  font-size: 14px;
}

.playing-card.red .card-suit {
  color: #e94560;
}

.playing-card:not(.red) .card-suit {
  color: #1a1a2e;
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-suit-large {
  font-size: 32px;
  opacity: 0.3;
}

.playing-card.red .card-suit-large {
  color: #e94560;
}

.playing-card:not(.red) .card-suit-large {
  color: #1a1a2e;
}

.card-back {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a4a7a 0%, #0f3460 100%);
  border: 2px solid #2a5a9a;
  position: relative;
  overflow: hidden;
}

.card-pattern {
  width: 100%;
  height: 100%;
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 5px,
      rgba(255, 255, 255, 0.1) 5px,
      rgba(255, 255, 255, 0.1) 10px
    ),
    repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 5px,
      rgba(255, 255, 255, 0.1) 5px,
      rgba(255, 255, 255, 0.1) 10px
    );
}
</style>
