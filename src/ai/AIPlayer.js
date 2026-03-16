// AI决策逻辑
import { HandEvaluator } from '../game/HandEvaluator.js'
import { PLAYER_STATUS } from '../game/GameState.js'

export const AI_DIFFICULTY = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
}

export class AIPlayer {
  constructor(difficulty = AI_DIFFICULTY.MEDIUM) {
    this.difficulty = difficulty
  }

  // 做出决策
  makeDecision(game) {
    const player = game.getCurrentPlayer()
    if (!player || player.isHuman) return null

    const actions = game.getAvailableActions(player.id)
    if (actions.length === 0) return null

    const handStrength = this.evaluateHandStrength(game, player)
    const potOdds = this.calculatePotOdds(game)
    const position = this.getPosition(game, player)
    const playerStyle = this.getPlayerStyle(game, player)

    switch (this.difficulty) {
      case AI_DIFFICULTY.EASY:
        return this.easyDecision(actions, handStrength)
      case AI_DIFFICULTY.MEDIUM:
        return this.mediumDecision(game, actions, handStrength, potOdds)
      case AI_DIFFICULTY.HARD:
        return this.hardDecision(game, actions, handStrength, potOdds, position, playerStyle)
      default:
        return this.mediumDecision(game, actions, handStrength, potOdds)
    }
  }

  // 简单难度：随机决策
  easyDecision(actions, handStrength) {
    const foldAction = actions.find(a => a.type === 'fold')
    const callAction = actions.find(a => a.type === 'call')
    const raiseAction = actions.find(a => a.type === 'raise')
    const checkAction = actions.find(a => a.type === 'check')
    const allInAction = actions.find(a => a.type === 'allIn')

    const rand = Math.random()

    // 20% 加注, 40% 跟注, 40% 弃牌
    if (rand < 0.2 && raiseAction) {
      return { action: 'raise', amount: this.getRaiseAmount(raiseAction) }
    } else if (rand < 0.6) {
      if (checkAction) {
        return { action: 'check' }
      } else if (callAction) {
        return { action: 'call' }
      }
    }

    if (foldAction && rand >= 0.6) {
      return { action: 'fold' }
    }

    if (callAction) {
      return { action: 'call' }
    }

    return { action: checkAction ? 'check' : 'fold' }
  }

  // 中等难度：基于手牌强度和彩池赔率
  mediumDecision(game, actions, handStrength, potOdds) {
    const player = game.getCurrentPlayer()
    const canCheck = actions.some(a => a.type === 'check')
    const canFold = actions.some(a => a.type === 'fold')
    const canCall = actions.some(a => a.type === 'call')
    const canRaise = actions.some(a => a.type === 'raise')
    const canAllIn = actions.some(a => a.type === 'allIn')

    // 需要跟注时总是跟注
    if (canCall) {
      return { action: 'call' }
    }

    // 可以过牌时过牌
    if (canCheck) {
      return { action: 'check' }
    }

    // 强手牌：加注
    if (handStrength > 0.8 && canRaise) {
      return { action: 'raise', amount: this.getMediumRaiseAmount(game) }
    }

    // 非常好的手牌：全下
    if (handStrength > 0.9 && canAllIn) {
      return { action: 'allIn' }
    }

    // 弱手牌且赔率差：弃牌
    if (handStrength < 0.4 && canFold) {
      if (Math.random() < 0.7) {
        return { action: 'fold' }
      }
    }

    return { action: canRaise ? 'raise' : 'fold', amount: this.getMediumRaiseAmount(game) }
  }

  // 困难难度：综合考虑
  hardDecision(game, actions, handStrength, potOdds, position, playerStyle) {
    const player = game.getCurrentPlayer()
    const canCheck = actions.some(a => a.type === 'check')
    const canFold = actions.some(a => a.type === 'fold')
    const canCall = actions.some(a => a.type === 'call')
    const canRaise = actions.some(a => a.type === 'raise')
    const canAllIn = actions.some(a => a.type === 'allIn')

    // 位置加分
    const positionBonus = position >= game.state.players.length - 2 ? 0.1 : 0

    // 行动力加分（激进玩家）
    const aggressionBonus = playerStyle.aggression > 0.6 ? 0.15 : 0

    const adjustedStrength = Math.min(1, handStrength + positionBonus + aggressionBonus)

    // 翻牌后评估
    if (game.state.communityCards.length >= 3) {
      return this.postFlopDecision(game, actions, adjustedStrength, potOdds)
    }

    // 翻牌前决策
    return this.preFlopDecision(game, actions, adjustedStrength, canRaise, canAllIn)
  }

  // 翻牌前决策
  preFlopDecision(game, actions, strength, canRaise, canAllIn) {
    const canCheck = actions.some(a => a.type === 'check')
    const canCall = actions.some(a => a.type === 'call')

    if (canCheck) {
      return { action: 'check' }
    }

    // 超强手牌
    if (strength > 0.85) {
      if (canRaise) {
        return { action: 'raise', amount: this.getMaxRaise(game) }
      }
      if (canAllIn) {
        return { action: 'allIn' }
      }
    }

    // 强手牌
    if (strength > 0.7 && canRaise) {
      return { action: 'raise', amount: this.getMediumRaiseAmount(game) }
    }

    // 中等手牌
    if (strength > 0.5) {
      if (canCall) {
        return { action: 'call' }
      }
      if (canRaise) {
        return { action: 'raise', amount: this.getSmallRaise(game) }
      }
    }

    // 边缘手牌
    if (strength > 0.35 && canCall) {
      return { action: 'call' }
    }

    return { action: 'fold' }
  }

  // 翻牌后决策
  postFlopDecision(game, actions, strength, potOdds) {
    const canCheck = actions.some(a => a.type === 'check')
    const canFold = actions.some(a => a.type === 'fold')
    const canCall = actions.some(a => a.type === 'call')
    const canRaise = actions.some(a => a.type === 'raise')
    const canAllIn = actions.some(a => a.type === 'allIn')

    // 坚果牌：最大化价值
    if (strength > 0.95) {
      if (canRaise) {
        return { action: 'raise', amount: this.getMaxRaise(game) }
      }
      if (canAllIn) {
        return { action: 'allIn' }
      }
    }

    // 强手牌
    if (strength > 0.8) {
      if (canRaise) {
        return { action: 'raise', amount: this.getMediumRaiseAmount(game) }
      }
      if (canCall) {
        return { action: 'call' }
      }
    }

    // 中等手牌：控制彩池
    if (strength > 0.5) {
      if (canCheck) {
        return { action: 'check' }
      }
      if (canCall) {
        return { action: 'call' }
      }
    }

    // 弱手牌但赔率好
    if (strength < 0.5 && canCall && potOdds > strength + 0.1) {
      return { action: 'call' }
    }

    // 弱手牌：过牌或弃牌
    if (canCheck) {
      return { action: 'check' }
    }

    if (strength < 0.3 && canFold) {
      return { action: 'fold' }
    }

    if (canCall) {
      return { action: 'call' }
    }

    return { action: 'fold' }
  }

  // 评估手牌强度
  evaluateHandStrength(game, player) {
    if (player.cards.length < 2) return 0

    // 翻牌后评估实际牌型
    if (game.state.communityCards.length >= 3) {
      const hand = HandEvaluator.evaluate([...player.cards, ...game.state.communityCards])
      if (hand) {
        return this.handTypeToStrength(hand.type)
      }
    }

    // 翻牌前使用简单评估
    return game.getHandStrength(player.id)
  }

  // 转换牌型为强度值
  handTypeToStrength(type) {
    const strengths = {
      1: 0.1,   // 高牌
      2: 0.2,   // 一对
      3: 0.3,   // 两对
      4: 0.5,   // 三条
      5: 0.6,   // 顺子
      6: 0.7,   // 同花
      7: 0.8,   // 葫芦
      8: 0.9,   // 四条
      9: 0.95,  // 同花顺
      10: 1.0   // 皇家同花顺
    }
    return strengths[type] || 0
  }

  // 计算彩池赔率
  calculatePotOdds(game) {
    const currentBet = game.state.currentBet
    const player = game.getCurrentPlayer()
    if (!player) return 0

    const toCall = currentBet - player.bet
    if (toCall <= 0) return 1

    const totalPot = game.state.pot + toCall
    return toCall / totalPot
  }

  // 获取玩家位置
  getPosition(game, player) {
    const dealerIndex = game.state.dealerIndex
    const playerIndex = player.id
    const totalPlayers = game.state.players.length

    let position = (playerIndex - dealerIndex + totalPlayers) % totalPlayers
    return position
  }

  // 获取玩家风格
  getPlayerStyle(game, player) {
    // 简化版本：基于历史行为判断
    const history = game.state.actionHistory.filter(h => h.playerId === player.id)
    const raises = history.filter(h => h.action === 'raise' || h.action === 'allIn').length
    const total = history.length

    return {
      aggression: total > 0 ? raises / total : 0.5,
      tightness: 0.5 // 简化
    }
  }

  // 获取加注金额
  getRaiseAmount(action) {
    if (!action) return 0
    return Math.max(action.amount || 0, 20)
  }

  getSmallRaise(game) {
    return game.state.bigBlind * 2
  }

  getMediumRaiseAmount(game) {
    return game.state.bigBlind * 3
  }

  getMaxRaise(game) {
    const player = game.getCurrentPlayer()
    return player ? player.chips : 0
  }
}

export default AIPlayer
