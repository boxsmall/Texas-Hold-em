// 扑克牌组管理

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

export class Deck {
  constructor() {
    this.cards = []
    this.reset()
  }

  // 重置牌组
  reset() {
    this.cards = []
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        this.cards.push({
          suit,
          rank,
          value: this.getRankValue(rank),
          color: (suit === '♥' || suit === '♦') ? 'red' : 'black'
        })
      }
    }
  }

  // 获取牌面值
  getRankValue(rank) {
    const values = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
      '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    }
    return values[rank]
  }

  // 洗牌 (Fisher-Yates算法)
  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]]
    }
  }

  // 发牌
  deal(count = 1) {
    if (this.cards.length < count) {
      this.reset()
      this.shuffle()
    }
    return this.cards.splice(0, count)
  }

  // 获取剩余牌数
  remaining() {
    return this.cards.length
  }
}

export default Deck
