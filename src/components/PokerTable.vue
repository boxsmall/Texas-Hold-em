<template>
  <div class="poker-table">
    <!-- 彩池显示 -->
    <PotDisplay
      :pot="gameState.pot"
      :phase="gameState.phase"
    />

    <!-- 公共牌 -->
    <div class="community-cards">
      <PlayingCard
        v-for="(card, index) in gameState.communityCards"
        :key="index"
        :card="card"
        :faceUp="true"
      />
      <div v-if="gameState.communityCards.length === 0" class="empty-community">
        <span v-if="gameState.phase === 'preFlop'">翻牌前</span>
      </div>
    </div>

    <!-- 玩家座位 -->
    <div class="players-container">
      <PlayerSeat
        v-for="(player, index) in gameState.players"
        :key="player.id"
        :player="player"
        :position="getPlayerPosition(index)"
        :isCurrentPlayer="isCurrentPlayer(player.id)"
        :isDealer="index === gameState.dealerIndex"
        :gamePhase="gameState.phase"
      />
    </div>

    <!-- 操作面板 -->
    <ControlPanel
      v-if="canAct"
      :player="currentPlayer"
      :gameState="gameState"
      @action="handleAction"
    />

    <!-- 游戏阶段提示 -->
    <div class="phase-indicator">
      {{ phaseText }}
    </div>

    <!-- 下一手牌按钮 -->
    <button
      v-if="gameState.phase === 'end'"
      class="next-hand-btn"
      @click="$emit('nextHand')"
    >
      下一手牌
    </button>

    <!-- 赢家显示 -->
    <div v-if="gameState.phase === 'end' && gameState.winner" class="winner-display">
      <div class="winner-text">
        {{ winnerText }}
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { GAME_PHASES } from '../game/GameState.js'
import PlayerSeat from './PlayerSeat.vue'
import PlayingCard from './PlayingCard.vue'
import PotDisplay from './PotDisplay.vue'
import ControlPanel from './ControlPanel.vue'

export default {
  name: 'PokerTable',
  components: {
    PlayerSeat,
    PlayingCard,
    PotDisplay,
    ControlPanel
  },
  props: {
    game: Object,
    gameState: Object,
    aiPlayer: Object
  },
  emits: ['action', 'nextHand'],
  setup(props, { emit }) {
    const currentPlayer = computed(() => {
      return props.game?.getCurrentPlayer()
    })

    const canAct = computed(() => {
      if (!currentPlayer.value) return false
      return currentPlayer.value.isHuman &&
             props.gameState.phase !== GAME_PHASES.SETUP &&
             props.gameState.phase !== GAME_PHASES.END
    })

    const phaseText = computed(() => {
      const phase = props.gameState.phase
      switch (phase) {
        case GAME_PHASES.PRE_FLOP: return '翻牌前'
        case GAME_PHASES.FLOP: return '翻牌'
        case GAME_PHASES.TURN: return '转牌'
        case GAME_PHASES.RIVER: return '河牌'
        case GAME_PHASES.SHOWDOWN: return '摊牌'
        case GAME_PHASES.END: return '本局结束'
        default: return ''
      }
    })

    const winnerText = computed(() => {
      if (!props.gameState.winner) return ''
      const winners = props.gameState.winner.map(id => {
        const player = props.gameState.players.find(p => p.id === id)
        return player?.name || `玩家${id}`
      })
      return winners.join('、') + ' 获胜！'
    })

    const getPlayerPosition = (index) => {
      const total = props.gameState.players?.length || 0
      if (total <= 2) return ['bottom', 'top'][index]
      if (total === 3) return ['bottom', 'top-left', 'top-right'][index]
      if (total === 4) return ['bottom', 'left', 'top', 'right'][index]
      if (total === 5) return ['bottom', 'bottom-left', 'top-left', 'top-right', 'right'][index]
      return ['bottom', 'bottom-left', 'left', 'top-left', 'top-right', 'right'][index]
    }

    const isCurrentPlayer = (playerId) => {
      return currentPlayer.value?.id === playerId
    }

    const handleAction = (action) => {
      emit('action', action)
    }

    return {
      currentPlayer,
      canAct,
      phaseText,
      winnerText,
      getPlayerPosition,
      isCurrentPlayer,
      handleAction
    }
  }
}
</script>

<style scoped>
.poker-table {
  width: 100%;
  max-width: 1200px;
  min-height: 700px;
  padding: 20px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.community-cards {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin: 20px 0;
  min-height: 100px;
  align-items: center;
}

.empty-community {
  width: 70px;
  height: 100px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
  font-size: 12px;
}

.players-container {
  position: relative;
  width: 100%;
  height: 400px;
}

.phase-indicator {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  border: 1px solid rgba(233, 69, 96, 0.5);
}

.next-hand-btn {
  position: absolute;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
  padding: 15px 40px;
  background: linear-gradient(145deg, #e94560 0%, #c73e54 100%);
  border: none;
  border-radius: 30px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(233, 69, 96, 0.4);
}

.next-hand-btn:hover {
  transform: translateX(-50%) translateY(-2px);
  box-shadow: 0 6px 25px rgba(233, 69, 96, 0.5);
}

.winner-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  padding: 30px 60px;
  border-radius: 20px;
  border: 2px solid #e94560;
  z-index: 200;
}

.winner-text {
  color: #ffd700;
  font-size: 28px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  animation: winnerPulse 1s ease-in-out infinite;
}

@keyframes winnerPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
</style>
