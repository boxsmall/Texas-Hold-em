// 游戏主逻辑
import { Deck } from './Deck.js'
import { HandEvaluator, HAND_TYPES } from './HandEvaluator.js'
import { GameState, GAME_PHASES, PLAYER_STATUS } from './GameState.js'

export class PokerGame {
  constructor() {
    this.deck = new Deck()
    this.state = new GameState()
  }

  // 找到从 startIndex 开始的第一个“可行动”玩家下标
  // 可行动 = ACTIVE 且筹码>0（ALL_IN 玩家无法再行动）
  getFirstActionableIndex(startIndex) {
    const total = this.state.players.length
    if (total <= 0) return null

    for (let offset = 0; offset < total; offset++) {
      const index = (startIndex + offset) % total
      const player = this.state.players[index]
      if (player?.status === PLAYER_STATUS.ACTIVE && player.chips > 0) {
        return index
      }
    }

    return null
  }

  // 确保 currentPlayerIndex 指向可行动玩家，否则移动到从 startIndex 开始的第一个可行动玩家
  ensureActionableCurrentPlayer(startIndex = this.state.currentPlayerIndex) {
    const current = this.state.players[this.state.currentPlayerIndex]
    if (current?.status === PLAYER_STATUS.ACTIVE && current.chips > 0) return

    const nextIndex = this.getFirstActionableIndex(startIndex)
    if (nextIndex !== null) {
      this.state.currentPlayerIndex = nextIndex
    }
  }

  // 当所有未弃牌玩家都已全下（或没有筹码可行动）时，自动推进到摊牌/结束
  autoAdvanceIfNoActions() {
    const hasActionablePlayer = this.state.players.some(
      p => p.status === PLAYER_STATUS.ACTIVE && p.chips > 0
    )
    if (hasActionablePlayer) return

    // 保护性循环，最多推进 5 次（PRE_FLOP -> FLOP -> TURN -> RIVER -> SHOWDOWN/END）
    for (let guard = 0; guard < 5; guard++) {
      const before = this.state.phase
      if (before === GAME_PHASES.SETUP || before === GAME_PHASES.END) return
      this.nextPhase()
      if (this.state.phase === before || this.state.phase === GAME_PHASES.END) return
    }
  }

  // 开始新游戏
  startNewGame(playerCount, aiDifficulty = 'medium') {
    this.deck.reset()
    this.deck.shuffle()
    this.state.reset()
    this.state.initPlayers(playerCount, 0)
    this.aiDifficulty = aiDifficulty
    this.state.smallBlind = 10
    this.state.bigBlind = 20
    this.startHand()
  }

  // 开始新的一手牌
  startHand() {
    this.deck.reset()
    this.deck.shuffle()
    this.state.communityCards = []
    this.state.pot = 0
    this.state.committedPot = 0
    this.state.currentBet = 0
    this.state.minRaise = this.state.bigBlind
    this.state.lastAggressor = -1
    this.state.actionHistory = []
    this.state.winner = null
    this.state.handResult = null
    this.state.actedThisRound = []

    // 重置玩家状态
    for (const player of this.state.players) {
      player.cards = []
      player.status = PLAYER_STATUS.ACTIVE
      player.bet = 0
      player.lastAction = null
      // 如果玩家筹码为0，给与补充
      if (player.chips <= 0) {
        player.chips = 1000
      }
      this.state.playerChips[player.id] = player.chips
    }

    // 发牌
    for (let i = 0; i < 2; i++) {
      for (const player of this.state.players) {
        const cards = this.deck.deal(1)
        player.cards.push(cards[0])
      }
    }

    this.state.phase = GAME_PHASES.PRE_FLOP
    // 设置前注和大盲（盲注属于翻牌前）
    this.postBlinds()
  }

  // 设置前注和大盲
  postBlinds() {
    const sbPlayer = this.state.players[this.state.dealerIndex]
    const bbPlayer = this.state.players[(this.state.dealerIndex + 1) % this.state.players.length]

    // 小盲
    const sbAmount = Math.min(sbPlayer.chips, this.state.smallBlind)
    sbPlayer.chips -= sbAmount
    sbPlayer.bet += sbAmount
    if (sbPlayer.chips === 0) {
      sbPlayer.status = PLAYER_STATUS.ALL_IN
    }

    // 大盲
    const bbAmount = Math.min(bbPlayer.chips, this.state.bigBlind)
    bbPlayer.chips -= bbAmount
    bbPlayer.bet += bbAmount
    if (bbPlayer.chips === 0) {
      bbPlayer.status = PLAYER_STATUS.ALL_IN
    }

    this.state.currentBet = this.state.bigBlind
    this.state.updatePot()
    // 翻牌前行动从大盲位后的第一位玩家开始（小盲位后面的玩家）
    this.state.currentPlayerIndex = (this.state.dealerIndex + 2) % this.state.players.length
    // 盲注是强制下注，不算“已行动”，否则盲位玩家会被跳过
    this.state.actedThisRound = []

    this.state.addAction(sbPlayer.id, 'smallBlind', sbAmount)
    this.state.addAction(bbPlayer.id, 'bigBlind', bbAmount)

    // 如果首行动玩家不可行动（例如已全下），跳到下一位可行动玩家；
    // 若无人可行动（全员全下），自动推进到摊牌
    this.ensureActionableCurrentPlayer(this.state.currentPlayerIndex)
    this.autoAdvanceIfNoActions()
  }

  // 玩家行动
  playerAction(playerId, actionType, amount = 0) {
    const player = this.state.players.find(p => p.id === playerId)
    if (!player || player.status !== PLAYER_STATUS.ACTIVE) return false

    switch (actionType) {
      case 'fold':
        player.status = PLAYER_STATUS.FOLDED
        player.lastAction = '弃牌'
        this.state.addAction(playerId, 'fold')
        break

      case 'check':
        player.lastAction = '过牌'
        this.state.addAction(playerId, 'check')
        break

      case 'call':
        const callAmount = Math.min(player.chips, this.state.currentBet - player.bet)
        player.chips -= callAmount
        player.bet += callAmount
        player.lastAction = `跟注 ${callAmount}`
        this.state.addAction(playerId, 'call', callAmount)
        if (player.chips === 0) {
          player.status = PLAYER_STATUS.ALL_IN
        }
        break

      case 'raise':
        const raiseAmount = Math.max(amount, this.state.currentBet + this.state.minRaise)
        const totalBet = Math.min(player.chips + player.bet, raiseAmount)
        const betIncrease = totalBet - player.bet

        if (betIncrease > 0) {
          player.chips -= betIncrease
          player.bet = totalBet
          this.state.currentBet = totalBet
          // 最小加注额应该是加注的金额与大盲注之间的较大值
          this.state.minRaise = Math.max(betIncrease, this.state.bigBlind)
          this.state.lastAggressor = playerId
          player.lastAction = `加注 ${betIncrease}`
          this.state.addAction(playerId, 'raise', betIncrease)

          // 重置本轮行动记录，让所有玩家都有机会再次行动
          this.state.actedThisRound = [playerId]
        }
        if (player.chips === 0) {
          player.status = PLAYER_STATUS.ALL_IN
        }
        break

      case 'allIn':
        const allInAmount = player.chips
        player.bet += allInAmount
        player.chips = 0
        player.status = PLAYER_STATUS.ALL_IN
        if (player.bet > this.state.currentBet) {
          this.state.currentBet = player.bet
          // 全下后的最小加注额应该是全下金额与大盲注的较大值
          this.state.minRaise = Math.max(allInAmount, this.state.bigBlind)
          this.state.lastAggressor = playerId
          // 重置本轮行动记录，让所有玩家都有机会再次行动
          this.state.actedThisRound = [playerId]
        }
        player.lastAction = `全下 ${allInAmount}`
        this.state.addAction(playerId, 'allIn', allInAmount)
        break
    }

    // 标记玩家已在本轮行动
    if (!this.state.actedThisRound.includes(playerId)) {
      this.state.actedThisRound.push(playerId)
    }

    this.state.updatePot()

    // 检查是否只剩一个玩家
    if (this.state.isOnePlayerLeft()) {
      this.resolveWinner()
      return true
    }

    // 检查是否所有玩家都已行动
    const allActed = this.state.allPlayersActed()
    if (allActed) {
      this.nextPhase()
    } else {
      // 下一位玩家行动
      const nextPlayer = this.state.getNextPlayer()
      if (nextPlayer) {
        this.state.currentPlayerIndex = nextPlayer.id
      } else {
        // 如果没有下一个可行动的玩家（所有人都在等待），进入下一阶段
        this.nextPhase()
      }
    }

    // 进入新阶段后，如果行动位不可行动则矫正；
    // 如果所有玩家都已全下，自动推进到摊牌/结束
    this.ensureActionableCurrentPlayer(this.state.currentPlayerIndex)
    this.autoAdvanceIfNoActions()

    return true
  }

  // 进入下一阶段
  nextPhase() {
    // 进入下一轮下注前，把本轮 bet “沉入底池”，否则 reset bet 后底池会丢失
    this.state.updatePot()
    this.state.committedPot = this.state.pot

    // 重置玩家下注
    for (const player of this.state.players) {
      player.bet = 0
    }
    this.state.pot = this.state.committedPot
    this.state.currentBet = 0
    this.state.lastAggressor = -1
    this.state.actedThisRound = []  // 重置本轮行动记录

    switch (this.state.phase) {
      case GAME_PHASES.PRE_FLOP:
        this.state.phase = GAME_PHASES.FLOP
        this.dealCommunityCards(3)
        this.state.currentPlayerIndex = (this.state.dealerIndex + 1) % this.state.players.length
        this.ensureActionableCurrentPlayer(this.state.currentPlayerIndex)
        break

      case GAME_PHASES.FLOP:
        this.state.phase = GAME_PHASES.TURN
        this.dealCommunityCards(1)
        this.state.currentPlayerIndex = (this.state.dealerIndex + 1) % this.state.players.length
        this.ensureActionableCurrentPlayer(this.state.currentPlayerIndex)
        break

      case GAME_PHASES.TURN:
        this.state.phase = GAME_PHASES.RIVER
        this.dealCommunityCards(1)
        this.state.currentPlayerIndex = (this.state.dealerIndex + 1) % this.state.players.length
        this.ensureActionableCurrentPlayer(this.state.currentPlayerIndex)
        break

      case GAME_PHASES.RIVER:
        this.state.phase = GAME_PHASES.SHOWDOWN
        this.evaluateHands()
        break
    }
  }

  // 发公共牌
  dealCommunityCards(count) {
    const cards = this.deck.deal(count)
    this.state.communityCards.push(...cards)
    this.state.setCommunityCards(this.state.communityCards)
  }

  // 评估手牌并确定赢家
  evaluateHands() {
    const activePlayers = this.state.getActivePlayers()
    if (activePlayers.length === 1) {
      this.resolveWinner()
      return
    }

    let bestHand = null
    let winners = []

    for (const player of activePlayers) {
      const hand = HandEvaluator.evaluate([...player.cards, ...this.state.communityCards])
      player.handResult = hand

      if (!bestHand || HandEvaluator.compareHands(hand, bestHand) > 0) {
        bestHand = hand
        winners = [player]
      } else if (HandEvaluator.compareHands(hand, bestHand) === 0) {
        winners.push(player)
      }
    }

    // 分配彩池
    this.distributePot(winners)
  }

  // 分配彩池
  distributePot(winners) {
    const totalPot = this.state.pot
    const winnerCount = winners.length
    const winAmount = Math.floor(totalPot / winnerCount)

    for (const winner of winners) {
      winner.chips += winAmount
      this.state.playerChips[winner.id] = winner.chips
    }

    this.state.winner = winners.map(w => w.id)
    this.state.phase = GAME_PHASES.END
  }

  // 快速解决（只剩一个玩家）
  resolveWinner() {
    const activePlayers = this.state.getActivePlayers()
    if (activePlayers.length === 1) {
      const winner = activePlayers[0]
      winner.chips += this.state.pot
      this.state.playerChips[winner.id] = winner.chips
      this.state.winner = [winner.id]
      winner.lastAction = '获胜'
    }
    this.state.phase = GAME_PHASES.END
  }

  // 继续下一手牌
  nextHand() {
    // 移动庄家
    this.state.dealerIndex = (this.state.dealerIndex + 1) % this.state.players.length
    this.startHand()
  }

  // 获取玩家手牌强度（0-1）
  getHandStrength(playerId) {
    const player = this.state.players.find(p => p.id === playerId)
    if (!player || player.cards.length < 2) return 0

    // 简单的手牌强度评估
    const values = player.cards.map(c => c.value)
    const suits = player.cards.map(c => c.suit)
    const isPair = values[0] === values[1]
    const isSuited = suits[0] === suits[1]
    const highCard = Math.max(...values)

    let strength = 0

    // 对子
    if (isPair) {
      strength = (values[0] - 2) / 12 * 0.6 + 0.4
      if (values[0] >= 10) strength = 0.9
      if (values[0] >= 12) strength = 0.95
    } else {
      // 高牌
      strength = highCard / 14 * 0.3

      // 同花加成分
      if (isSuited) strength += 0.15

      // 顺子潜力
      const diff = Math.abs(values[0] - values[1])
      if (diff <= 4) strength += 0.1
      if (diff <= 2) strength += 0.1
    }

    return Math.min(1, strength)
  }

  // 获取当前玩家
  getCurrentPlayer() {
    return this.state.players[this.state.currentPlayerIndex]
  }

  // 获取玩家可进行的动作
  getAvailableActions(playerId) {
    const player = this.state.players.find(p => p.id === playerId)
    if (!player) return []
    return this.state.getAvailableActions(player)
  }

  // 获取AI决策
  getAIDecision(playerId) {
    const player = this.state.players.find(p => p.id === playerId)
    if (!player || !player.isHuman) return null
    return null
  }
}

export default PokerGame
