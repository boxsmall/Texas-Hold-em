<template>
  <div class="control-panel">
    <div class="player-chips-display">
      <span class="label">你的筹码:</span>
      <span class="chips">{{ player?.chips || 0 }}</span>
    </div>

    <div class="actions">
      <button
        v-for="action in availableActions"
        :key="action.type"
        :class="['action-btn', action.type]"
        @click="handleAction(action)"
      >
        {{ action.label }}
        <span v-if="action.type === 'call'" class="amount">
          ({{ callAmount }})
        </span>
        <span v-else-if="action.type === 'raise'" class="amount">
          ({{ raiseRange[0] }}-{{ raiseRange[1] }})
        </span>
      </button>
    </div>

    <div v-if="showRaiseInput" class="raise-input">
      <label>加注金额:</label>
      <input
        type="range"
        v-model.number="raiseAmount"
        :min="raiseRange[0]"
        :max="raiseRange[1]"
      />
      <span class="raise-value">{{ raiseAmount }}</span>
      <button class="confirm-btn" @click="confirmRaise">确认</button>
      <button class="cancel-btn" @click="cancelRaise">取消</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'ControlPanel',
  props: {
    player: Object,
    gameState: Object
  },
  emits: ['action'],
  setup(props, { emit }) {
    const showRaiseInput = ref(false)
    const raiseAmount = ref(0)

    const availableActions = computed(() => {
      if (!props.player) return []
      return props.gameState.getAvailableActions(props.player)
    })

    const callAmount = computed(() => {
      if (!props.player) return 0
      return Math.max(0, props.gameState.currentBet - props.player.bet)
    })

    const raiseRange = computed(() => {
      if (!props.player) return [0, 0]
      const minRaise = props.gameState.currentBet > 0
        ? props.gameState.currentBet + props.gameState.minRaise
        : props.gameState.bigBlind
      const maxRaise = props.player.chips + props.player.bet
      return [minRaise, Math.min(maxRaise, props.player.chips + props.player.bet)]
    })

    watch(raiseRange, (range) => {
      raiseAmount.value = range[0]
    })

    const handleAction = (action) => {
      if (action.type === 'raise') {
        showRaiseInput.value = true
        raiseAmount.value = raiseRange.value[0]
      } else {
        emit('action', { type: action.type, amount: 0 })
      }
    }

    const confirmRaise = () => {
      if (raiseAmount.value >= raiseRange.value[0]) {
        emit('action', {
          type: 'raise',
          amount: raiseAmount.value
        })
        showRaiseInput.value = false
      }
    }

    const cancelRaise = () => {
      showRaiseInput.value = false
    }

    return {
      availableActions,
      callAmount,
      raiseRange,
      showRaiseInput,
      raiseAmount,
      handleAction,
      confirmRaise,
      cancelRaise
    }
  }
}
</script>

<style scoped>
.control-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(26, 26, 62, 0.95) 0%, rgba(15, 52, 96, 0.95) 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  border-top: 2px solid rgba(233, 69, 96, 0.3);
}

.player-chips-display {
  display: flex;
  align-items: center;
  gap: 10px;
}

.player-chips-display .label {
  color: #a0a0c0;
  font-size: 14px;
}

.player-chips-display .chips {
  color: #ffd700;
  font-size: 20px;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  justify-content: center;
}

.action-btn {
  padding: 12px 30px;
  border: none;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.action-btn .amount {
  font-size: 12px;
  opacity: 0.8;
  font-weight: normal;
}

.action-btn.check {
  background: #3498db;
  color: #fff;
}

.action-btn.call {
  background: #27ae60;
  color: #fff;
}

.action-btn.raise {
  background: #e94560;
  color: #fff;
}

.action-btn.fold {
  background: #7f8c8d;
  color: #fff;
}

.action-btn.allIn {
  background: #f39c12;
  color: #fff;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.raise-input {
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 25px;
  border-radius: 15px;
}

.raise-input label {
  color: #a0a0c0;
  font-size: 14px;
}

.raise-input input[type="range"] {
  width: 200px;
  accent-color: #e94560;
}

.raise-value {
  color: #ffd700;
  font-size: 18px;
  font-weight: bold;
  min-width: 60px;
}

.confirm-btn {
  padding: 8px 20px;
  background: #27ae60;
  border: none;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.cancel-btn {
  padding: 8px 20px;
  background: #7f8c8d;
  border: none;
  border-radius: 20px;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}
</style>
