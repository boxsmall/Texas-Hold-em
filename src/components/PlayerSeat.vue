<template>
  <div :class="['player-seat', positionClass, { 'is-current': isCurrentPlayer, 'is-dealer': isDealer }]">
    <!-- 庄家标记 -->
    <div v-if="isDealer" class="dealer-button">D</div>

    <!-- 玩家信息 -->
    <div class="player-info">
      <div class="player-avatar">
        {{ player.isHuman ? '👤' : '🤖' }}
      </div>
      <div class="player-name">{{ player.name }}</div>
      <div class="player-chips">{{ player.chips }}</div>
    </div>

    <!-- 玩家状态 -->
    <div v-if="player.status === 'folded'" class="player-status folded">
      弃牌
    </div>
    <div v-else-if="player.status === 'allIn'" class="player-status allin">
      全下
    </div>

    <!-- 手牌 -->
    <div class="player-cards">
      <template v-if="player.status !== 'folded' && player.cards.length > 0">
        <PlayingCard
          v-for="(card, index) in player.cards"
          :key="index"
          :card="card"
          :faceUp="player.isHuman || showCards || gamePhase === 'end' || gamePhase === 'showdown'"
        />
      </template>
      <template v-else-if="player.status !== 'folded'">
        <PlayingCard :faceUp="false" />
        <PlayingCard :faceUp="false" />
      </template>
    </div>

    <!-- 下注额 -->
    <div v-if="player.bet > 0" class="player-bet">
      {{ player.bet }}
    </div>

    <!-- 最后动作 -->
    <div v-if="player.lastAction" class="player-action">
      {{ player.lastAction }}
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import PlayingCard from './PlayingCard.vue'

export default {
  name: 'PlayerSeat',
  components: {
    PlayingCard
  },
  props: {
    player: Object,
    position: {
      type: String,
      default: 'bottom'
    },
    isCurrentPlayer: Boolean,
    isDealer: Boolean,
    gamePhase: String,
    showCards: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const positionClass = computed(() => {
      return `position-${props.position}`
    })

    return {
      positionClass
    }
  }
}
</script>

<style scoped>
.player-seat {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.position-bottom {
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.position-top {
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.position-left {
  top: 50%;
  left: 10px;
  transform: translateY(-50%);
}

.position-right {
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
}

.position-top-left {
  top: 10px;
  left: 15%;
}

.position-top-right {
  top: 10px;
  right: 15%;
}

.position-bottom-left {
  bottom: 10px;
  left: 15%;
}

.position-bottom-right {
  bottom: 10px;
  right: 15%;
}

.player-seat.is-current {
  transform: translateX(-50%) scale(1.05);
}

.position-left.is-current {
  transform: translateY(-50%) scale(1.05);
}

.position-right.is-current {
  transform: translateY(-50%) scale(1.05);
}

.position-top-left.is-current,
.position-top-right.is-current,
.position-bottom-left.is-current,
.position-bottom-right.is-current {
  transform: scale(1.05);
}

.player-seat.is-current .player-info {
  box-shadow: 0 0 20px rgba(233, 69, 96, 0.8);
  border-color: #e94560;
}

.dealer-button {
  position: absolute;
  top: -10px;
  left: -10px;
  width: 24px;
  height: 24px;
  background: #e94560;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
  font-weight: bold;
  border: 2px solid #fff;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(15, 52, 96, 0.9);
  padding: 10px 15px;
  border-radius: 12px;
  border: 2px solid #1a4a7a;
  min-width: 90px;
  transition: all 0.3s ease;
}

.player-avatar {
  font-size: 24px;
  margin-bottom: 4px;
}

.player-name {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.player-chips {
  color: #ffd700;
  font-size: 16px;
  font-weight: bold;
  margin-top: 4px;
}

.player-status {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 600;
}

.player-status.folded {
  background: rgba(150, 150, 150, 0.8);
  color: #fff;
}

.player-status.allin {
  background: rgba(255, 215, 0, 0.8);
  color: #333;
}

.player-cards {
  display: flex;
  gap: 3px;
}

.player-bet {
  position: absolute;
  top: -20px;
  background: rgba(0, 0, 0, 0.7);
  color: #e94560;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
  border: 1px solid #e94560;
}

.player-action {
  background: rgba(0, 0, 0, 0.6);
  color: #a0a0c0;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 11px;
}
</style>
