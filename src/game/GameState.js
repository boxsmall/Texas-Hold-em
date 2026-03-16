// 游戏状态管理

export const GAME_PHASES = {
  SETUP: 'setup',           // 设置阶段
  PRE_FLOP: 'preFlop',      // 翻牌前
  FLOP: 'flop',             // 翻牌
  TURN: 'turn',             // 转牌
  RIVER: 'river',           // 河牌
  SHOWDOWN: 'showdown',     // 摊牌
  END: 'end'                // 本局结束
}

export const PLAYER_STATUS = {
  ACTIVE: 'active',         // 参与中
  FOLDED: 'folded',         // 弃牌
  ALL_IN: 'allIn',          // 全下
  OUT: 'out'               // 出局
}

export class GameState {
  constructor() {
    this.reset()
  }

  reset() {
    this.phase = GAME_PHASES.SETUP
    this.players = []
    this.communityCards = []
    this.pot = 0
    // 已经“沉入底池”的筹码（上一轮及更早轮次的下注）
    this.committedPot = 0
    this.sidePots = []
    this.currentBet = 0
    this.dealerIndex = 0
    this.currentPlayerIndex = 0
    this.smallBlind = 10
    this.bigBlind = 20
    this.lastAggressor = -1
    this.bets = []
    this.playerChips = {}
    this.minRaise = 0
    this.winner = null
    this.handResult = null
    this.actionHistory = []
    this.actedThisRound = []  // 追踪本轮已行动的玩家
  }

  // 初始化玩家
  initPlayers(playerCount, humanIndex = 0) {
    this.players = []
    for (let i = 0; i < playerCount; i++) {
      this.players.push({
        id: i,
        name: i === humanIndex ? '你' : `电脑${i}`,
        isHuman: i === humanIndex,
        cards: [],
        status: PLAYER_STATUS.ACTIVE,
        chips: 1000,
        bet: 0,
        lastAction: null
      })
    }
    this.playerChips = {}
    for (const player of this.players) {
      this.playerChips[player.id] = player.chips
    }
  }

  // 设置玩家手牌
  setPlayerCards(playerId, cards) {
    const player = this.players.find(p => p.id === playerId)
    if (player) {
      player.cards = cards
    }
  }

  // 设置公共牌
  setCommunityCards(cards) {
    this.communityCards = cards
  }

  // 获取当前下注轮次的玩家数量
  getActivePlayerCount() {
    return this.players.filter(p =>
      p.status === PLAYER_STATUS.ACTIVE || p.status === PLAYER_STATUS.ALL_IN
    ).length
  }

  // 获取未弃牌的玩家
  getActivePlayers() {
    return this.players.filter(p =>
      p.status === PLAYER_STATUS.ACTIVE || p.status === PLAYER_STATUS.ALL_IN
    )
  }

  // 检查是否只有一个玩家未弃牌
  isOnePlayerLeft() {
    return this.getActivePlayerCount() === 1
  }

  // 检查是否所有玩家都已行动
  allPlayersActed() {
    const activePlayers = this.getActivePlayers()
    if (activePlayers.length <= 1) return true

    // 只要求“仍可行动”的玩家都行动过：
    // ALL_IN 玩家无法行动，不应阻塞轮次推进
    const actionPlayers = activePlayers.filter(p => p.status === PLAYER_STATUS.ACTIVE && p.chips > 0)

    // 检查所有可行动玩家是否都已在本轮行动
    const allActed = actionPlayers.every(p => this.actedThisRound.includes(p.id))
    if (!allActed) return false

    // 所有玩家都已行动，检查下注是否平衡
    return actionPlayers.every(p => p.bet >= this.currentBet)
  }

  // 获取下注最大的玩家
  getMaxBetter() {
    const activePlayers = this.getActivePlayers()
    return activePlayers.reduce((max, p) => p.bet > (max?.bet || 0) ? p : max, null)
  }

  // 获取下一位行动玩家
  getNextPlayer() {
    const activePlayers = this.getActivePlayers()
    if (activePlayers.length === 0) return null

    let nextIndex = (this.currentPlayerIndex + 1) % this.players.length
    let count = 0
    while (count < this.players.length) {
      const player = this.players[nextIndex]
      // 检查玩家是否可以行动且尚未在本轮行动
      // 可以行动 = 状态为ACTIVE且有筹码（ALL_IN玩家不能再行动）
      if (player.status === PLAYER_STATUS.ACTIVE &&
          player.chips > 0 &&
          !this.actedThisRound.includes(player.id)) {
        return player
      }
      nextIndex = (nextIndex + 1) % this.players.length
      count++
    }
    return null
  }

  // 更新彩池
  updatePot() {
    // pot = committedPot + 本轮所有玩家当前 bet 之和
    const roundTotal = this.players.reduce((sum, p) => sum + p.bet, 0)
    this.pot = this.committedPot + roundTotal
  }

  // 添加动作到历史
  addAction(playerId, action, amount = 0) {
    this.actionHistory.push({
      playerId,
      action,
      amount,
      phase: this.phase,
      timestamp: Date.now()
    })
  }

  // 获取玩家可进行的动作
  getAvailableActions(player) {
    const actions = []

    if (player.status !== PLAYER_STATUS.ACTIVE) {
      return actions
    }

    // 可以过牌
    if (player.bet >= this.currentBet) {
      actions.push({ type: 'check', label: '过牌' })
    } else {
      actions.push({ type: 'call', label: '跟注' })
    }

    // 可以加注
    const minRaiseAmount = this.currentBet > 0 ? this.currentBet + this.minRaise : this.bigBlind
    const callAmount = this.currentBet - player.bet
    if (player.chips > callAmount && player.chips >= minRaiseAmount) {
      actions.push({ type: 'raise', label: '加注' })
    }

    // 可以全下
    if (player.chips > 0) {
      actions.push({ type: 'allIn', label: '全下' })
    }

    // 可以弃牌
    if (player.bet < this.currentBet || this.currentBet === 0) {
      actions.push({ type: 'fold', label: '弃牌' })
    }

    return actions
  }
}

export default GameState
