<template>
  <div class="app">
    <div class="header">
      <h1>德州扑克</h1>
    </div>

    <GameSettings
      v-if="gamePhase === GAME_PHASES.SETUP"
      @start="startGame"
    />

    <PokerTable
      v-else
      :game="pokerGame"
      :gameState="gameState"
      :aiPlayer="aiPlayer"
      @action="handlePlayerAction"
      @nextHand="handleNextHand"
    />
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import { PokerGame } from './game/PokerGame.js'
import { AIPlayer, AI_DIFFICULTY } from './ai/AIPlayer.js'
import { GAME_PHASES } from './game/GameState.js'
import GameSettings from './components/GameSettings.vue'
import PokerTable from './components/PokerTable.vue'

export default {
  name: 'App',
  components: {
    GameSettings,
    PokerTable
  },
  setup() {
    const pokerGame = ref(null)
    const aiPlayer = ref(null)
    const gamePhase = ref(GAME_PHASES.SETUP)
    const gameState = computed(() => {
      if (!pokerGame.value?.state) {
        return { phase: GAME_PHASES.SETUP, players: [], communityCards: [], pot: 0 }
      }
      return pokerGame.value.state
    })
    const aiThinking = ref(false)
    let aiTimer = null

    // 监听 phase 变化
    watch(() => pokerGame.value?.state?.phase, (newPhase) => {
      if (newPhase) {
        gamePhase.value = newPhase
      }
    })

    const startGame = ({ playerCount, difficulty }) => {
      pokerGame.value = new PokerGame()
      aiPlayer.value = new AIPlayer(difficulty)
      pokerGame.value.startNewGame(playerCount, difficulty)
      gamePhase.value = pokerGame.value.state.phase

      // 开始AI思考
      startAIThinking()
    }

    const handlePlayerAction = (action) => {
      if (gameState.value.phase === GAME_PHASES.SETUP ||
          gameState.value.phase === GAME_PHASES.END) {
        return
      }

      const currentPlayer = pokerGame.value.getCurrentPlayer()
      if (!currentPlayer || !currentPlayer.isHuman) return

      pokerGame.value.playerAction(currentPlayer.id, action.type, action.amount)
    }

    const handleNextHand = () => {
      pokerGame.value.nextHand()
    }

    const startAIThinking = () => {
      if (aiTimer) {
        clearTimeout(aiTimer)
      }

      let isActing = false

      const think = () => {
        // 让 AI 轮询常驻：即使轮到真人/处于某些阶段，也继续安排下一次检查
        if (!pokerGame.value || !aiPlayer.value) {
          aiTimer = setTimeout(think, 500)
          return
        }

        // 如果AI正在行动，跳过本次
        if (isActing) {
          aiTimer = setTimeout(think, 500)
          return
        }

        const phase = gameState.value.phase
        if (phase === GAME_PHASES.SETUP || phase === GAME_PHASES.END) {
          aiTimer = setTimeout(think, 800)
          return
        }

        const currentPlayer = pokerGame.value.getCurrentPlayer()
        if (!currentPlayer) {
          aiTimer = setTimeout(think, 500)
          return
        }
        if (currentPlayer.isHuman) {
          // 关键修复：以前这里直接 return，导致 AI 轮询停止，
          // 真人加注/全下把回合交给电脑后，电脑不会再行动
          aiTimer = setTimeout(think, 500)
          return
        }

        // AI思考
        const decision = aiPlayer.value.makeDecision(pokerGame.value)
        if (decision) {
          isActing = true
          const playerId = currentPlayer.id
          setTimeout(() => {
            pokerGame.value.playerAction(playerId, decision.action, decision.amount)
            isActing = false
          }, 800)
        }

        // 继续监听
        aiTimer = setTimeout(think, 1500)
      }

      aiTimer = setTimeout(think, 1000)
    }

    // 监听游戏状态变化
    watch(() => gameState.value.phase, (newPhase, oldPhase) => {
      if (newPhase && newPhase !== GAME_PHASES.SETUP && newPhase !== GAME_PHASES.END) {
        startAIThinking()
      }
    })

    return {
      pokerGame,
      gameState,
      gamePhase,
      aiPlayer,
      GAME_PHASES,
      startGame,
      handlePlayerAction,
      handleNextHand
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #1a1a2e;
  min-height: 100vh;
  overflow-x: hidden;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  padding: 15px 20px;
  background: linear-gradient(180deg, #16213e 0%, #0f3460 100%);
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.header h1 {
  color: #e94560;
  font-size: 28px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 3px;
}
</style>
