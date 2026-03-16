// 牌型判定器

// 牌型枚举
export const HAND_TYPES = {
  HIGH_CARD: 1,
  ONE_PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10
}

export const HAND_NAMES = {
  [HAND_TYPES.HIGH_CARD]: '高牌',
  [HAND_TYPES.ONE_PAIR]: '一对',
  [HAND_TYPES.TWO_PAIR]: '两对',
  [HAND_TYPES.THREE_OF_A_KIND]: '三条',
  [HAND_TYPES.STRAIGHT]: '顺子',
  [HAND_TYPES.FLUSH]: '同花',
  [HAND_TYPES.FULL_HOUSE]: '葫芦',
  [HAND_TYPES.FOUR_OF_A_KIND]: '四条',
  [HAND_TYPES.STRAIGHT_FLUSH]: '同花顺',
  [HAND_TYPES.ROYAL_FLUSH]: '皇家同花顺'
}

export class HandEvaluator {
  // 评估手牌
  static evaluate(cards) {
    if (!cards || cards.length < 5) return null

    // 提取公共牌和手牌
    const allCards = [...cards].sort((a, b) => b.value - a.value)

    // 检查同花顺
    const flushResult = this.checkFlush(allCards)
    if (flushResult) {
      if (this.checkRoyalFlush(flushResult.cards)) {
        return { type: HAND_TYPES.ROYAL_FLUSH, cards: flushResult.cards, rank: flushResult.rank }
      }
      return { type: HAND_TYPES.STRAIGHT_FLUSH, cards: flushResult.cards, rank: flushResult.rank }
    }

    // 检查四条
    const fourResult = this.checkFourOfAKind(allCards)
    if (fourResult) {
      return { type: HAND_TYPES.FOUR_OF_A_KIND, cards: fourResult.cards, rank: fourResult.rank }
    }

    // 检查葫芦
    const fullHouseResult = this.checkFullHouse(allCards)
    if (fullHouseResult) {
      return { type: HAND_TYPES.FULL_HOUSE, cards: fullHouseResult.cards, rank: fullHouseResult.rank }
    }

    // 检查同花
    const flushOnlyResult = this.checkFlushOnly(allCards)
    if (flushOnlyResult) {
      return { type: HAND_TYPES.FLUSH, cards: flushOnlyResult.cards, rank: flushOnlyResult.rank }
    }

    // 检查顺子
    const straightResult = this.checkStraight(allCards)
    if (straightResult) {
      return { type: HAND_TYPES.STRAIGHT, cards: straightResult.cards, rank: straightResult.rank }
    }

    // 检查三条
    const threeResult = this.checkThreeOfAKind(allCards)
    if (threeResult) {
      return { type: HAND_TYPES.THREE_OF_A_KIND, cards: threeResult.cards, rank: threeResult.rank }
    }

    // 检查两对
    const twoPairResult = this.checkTwoPair(allCards)
    if (twoPairResult) {
      return { type: HAND_TYPES.TWO_PAIR, cards: twoPairResult.cards, rank: twoPairResult.rank }
    }

    // 检查一对
    const pairResult = this.checkOnePair(allCards)
    if (pairResult) {
      return { type: HAND_TYPES.ONE_PAIR, cards: pairResult.cards, rank: pairResult.rank }
    }

    // 高牌
    return { type: HAND_TYPES.HIGH_CARD, cards: allCards.slice(0, 5), rank: allCards[0].value }
  }

  // 检查同花顺
  static checkFlush(cards) {
    const suits = {}
    for (const card of cards) {
      if (!suits[card.suit]) suits[card.suit] = []
      suits[card.suit].push(card)
    }

    for (const suitCards of Object.values(suits)) {
      if (suitCards.length >= 5) {
        const sorted = suitCards.sort((a, b) => b.value - a.value)
        const straightResult = this.checkStraightInCards(sorted)
        if (straightResult) {
          return { cards: straightResult.cards, rank: straightResult.rank }
        }
      }
    }
    return null
  }

  // 检查纯同花
  static checkFlushOnly(cards) {
    const suits = {}
    for (const card of cards) {
      if (!suits[card.suit]) suits[card.suit] = []
      suits[card.suit].push(card)
    }

    for (const suitCards of Object.values(suits)) {
      if (suitCards.length >= 5) {
        const sorted = suitCards.sort((a, b) => b.value - a.value)
        return { cards: sorted.slice(0, 5), rank: sorted[0].value }
      }
    }
    return null
  }

  // 检查顺子
  static checkStraight(cards) {
    return this.checkStraightInCards(cards)
  }

  static checkStraightInCards(cards) {
    const uniqueValues = [...new Set(cards.map(c => c.value))].sort((a, b) => b - a)

    // A-2-3-4-5 特殊顺子
    if (uniqueValues.includes(14) && uniqueValues.includes(2) &&
        uniqueValues.includes(3) && uniqueValues.includes(4) && uniqueValues.includes(5)) {
      const straightCards = cards.filter(c => c.value === 5 || c.value === 4 || c.value === 3 || c.value === 2 || c.value === 14)
      const selected = []
      const values = [5, 4, 3, 2, 14]
      for (const v of values) {
        const card = straightCards.find(c => c.value === v)
        if (card) selected.push(card)
      }
      return { cards: selected, rank: 5 }
    }

    for (let i = 0; i <= uniqueValues.length - 5; i++) {
      const five = uniqueValues.slice(i, i + 5)
      if (five[0] - five[4] === 4) {
        const straightCards = []
        for (const v of five) {
          const card = cards.find(c => c.value === v)
          if (card) straightCards.push(card)
        }
        return { cards: straightCards, rank: five[0] }
      }
    }
    return null
  }

  // 检查四条
  static checkFourOfAKind(cards) {
    const counts = {}
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1
    }

    for (const [value, count] of Object.entries(counts)) {
      if (count === 4) {
        const fourCards = cards.filter(c => c.value === parseInt(value))
        // 选择最大的 kicker
        const kickers = cards.filter(c => c.value !== parseInt(value))
        const kicker = kickers.length > 0 ? kickers.sort((a, b) => b.value - a.value)[0] : null
        if (kicker) {
          return { cards: [...fourCards, kicker], rank: parseInt(value) }
        }
      }
    }
    return null
  }

  // 检查葫芦
  static checkFullHouse(cards) {
    const counts = {}
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1
    }

    let threeValue = null
    let twoValue = null

    for (const [value, count] of Object.entries(counts)) {
      if (count === 3) {
        threeValue = parseInt(value)
      } else if (count >= 2) {
        twoValue = parseInt(value)
      }
    }

    // 处理有多个三条的情况
    if (!twoValue) {
      const threeValues = Object.entries(counts).filter(([, c]) => c === 3).map(([v]) => parseInt(v))
      if (threeValues.length >= 2) {
        threeValue = Math.max(...threeValues)
        twoValue = threeValues.find(v => v !== threeValue)
      }
    }

    if (threeValue && twoValue) {
      const threeCards = cards.filter(c => c.value === threeValue).slice(0, 3)
      const twoCards = cards.filter(c => c.value === twoValue).slice(0, 2)
      return { cards: [...threeCards, ...twoCards], rank: threeValue }
    }
    return null
  }

  // 检查三条
  static checkThreeOfAKind(cards) {
    const counts = {}
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1
    }

    let threeValue = null
    for (const [value, count] of Object.entries(counts)) {
      if (count === 3) {
        threeValue = parseInt(value)
        break
      }
    }

    if (threeValue) {
      const threeCards = cards.filter(c => c.value === threeValue)
      const others = cards.filter(c => c.value !== threeValue).sort((a, b) => b.value - a.value).slice(0, 2)
      return { cards: [...threeCards, ...others], rank: threeValue }
    }
    return null
  }

  // 检查两对
  static checkTwoPair(cards) {
    const counts = {}
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1
    }

    const pairs = Object.entries(counts)
      .filter(([, count]) => count >= 2)
      .map(([value]) => parseInt(value))
      .sort((a, b) => b - a)

    if (pairs.length >= 2) {
      const highPair = cards.filter(c => c.value === pairs[0]).slice(0, 2)
      const lowPair = cards.filter(c => c.value === pairs[1]).slice(0, 2)
      const kicker = cards.find(c => c.value !== pairs[0] && c.value !== pairs[1])
      if (kicker) {
        return { cards: [...highPair, ...lowPair, kicker], rank: pairs[0] }
      }
    }
    return null
  }

  // 检查一对
  static checkOnePair(cards) {
    const counts = {}
    for (const card of cards) {
      counts[card.value] = (counts[card.value] || 0) + 1
    }

    let pairValue = null
    for (const [value, count] of Object.entries(counts)) {
      if (count >= 2) {
        pairValue = parseInt(value)
        break
      }
    }

    if (pairValue) {
      const pairCards = cards.filter(c => c.value === pairValue).slice(0, 2)
      const others = cards.filter(c => c.value !== pairValue).sort((a, b) => b.value - a.value).slice(0, 3)
      return { cards: [...pairCards, ...others], rank: pairValue }
    }
    return null
  }

  // 检查皇家同花顺
  static checkRoyalFlush(cards) {
    const values = cards.map(c => c.value)
    return values.includes(14) && values.includes(13) && values.includes(12) &&
           values.includes(11) && values.includes(10)
  }

  // 比较两手牌
  static compareHands(hand1, hand2) {
    if (!hand1 || !hand2) return 0
    if (hand1.type !== hand2.type) {
      return hand1.type > hand2.type ? 1 : -1
    }
    return hand1.rank > hand2.rank ? 1 : (hand1.rank < hand2.rank ? -1 : 0)
  }
}

export default HandEvaluator
