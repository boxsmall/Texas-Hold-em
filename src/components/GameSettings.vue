<template>
  <div class="settings-container">
    <div class="settings-card">
      <h2>游戏设置</h2>

      <div class="setting-group">
        <label>玩家数量</label>
        <div class="player-count-buttons">
          <button
            v-for="count in [2, 3, 4, 5, 6]"
            :key="count"
            :class="['count-btn', { active: playerCount === count }]"
            @click="playerCount = count"
          >
            {{ count }}人
          </button>
        </div>
      </div>

      <div class="setting-group">
        <label>AI难度</label>
        <div class="difficulty-buttons">
          <button
            v-for="diff in difficulties"
            :key="diff.value"
            :class="['diff-btn', { active: difficulty === diff.value }]"
            @click="difficulty = diff.value"
          >
            <span class="diff-name">{{ diff.label }}</span>
            <span class="diff-desc">{{ diff.desc }}</span>
          </button>
        </div>
      </div>

      <button class="start-btn" @click="startGame">
        开始游戏
      </button>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'GameSettings',
  emits: ['start'],
  setup(props, { emit }) {
    const playerCount = ref(4)
    const difficulty = ref('medium')

    const difficulties = [
      { value: 'easy', label: '简单', desc: '随机决策，适合练习' },
      { value: 'medium', label: '中等', desc: '考虑手牌强度和赔率' },
      { value: 'hard', label: '困难', desc: '综合分析，高手难度' }
    ]

    const startGame = () => {
      emit('start', {
        playerCount: playerCount.value,
        difficulty: difficulty.value
      })
    }

    return {
      playerCount,
      difficulty,
      difficulties,
      startGame
    }
  }
}
</script>

<style scoped>
.settings-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.settings-card {
  background: linear-gradient(145deg, #1a1a3e 0%, #16213e 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(233, 69, 96, 0.3);
}

.settings-card h2 {
  color: #e94560;
  text-align: center;
  margin-bottom: 30px;
  font-size: 24px;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group label {
  display: block;
  color: #a0a0c0;
  margin-bottom: 12px;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.player-count-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.count-btn {
  flex: 1;
  min-width: 70px;
  padding: 12px 15px;
  background: #0f3460;
  border: 2px solid #1a4a7a;
  border-radius: 10px;
  color: #a0a0c0;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.count-btn:hover {
  background: #1a4a7a;
  color: #fff;
}

.count-btn.active {
  background: #e94560;
  border-color: #e94560;
  color: #fff;
}

.difficulty-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.diff-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 15px 20px;
  background: #0f3460;
  border: 2px solid #1a4a7a;
  border-radius: 12px;
  color: #a0a0c0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.diff-btn:hover {
  background: #1a4a7a;
  color: #fff;
}

.diff-btn.active {
  background: linear-gradient(145deg, #e94560 0%, #c73e54 100%);
  border-color: #e94560;
  color: #fff;
}

.diff-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.diff-desc {
  font-size: 12px;
  opacity: 0.8;
}

.start-btn {
  width: 100%;
  padding: 18px;
  background: linear-gradient(145deg, #e94560 0%, #c73e54 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
  letter-spacing: 2px;
}

.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(233, 69, 96, 0.4);
}
</style>
