# Texas Hold'em Poker - 德州扑克

一款基于 Vue 3 构建的在线德州扑克游戏，支持人机对战。

## 在线体验

访问地址：https://boxsmall.github.io/Texas-Hold-em/

## 游戏特性

### 🎮 游戏模式
- **多人对战**：支持 2-6 名玩家同时游戏
- **人机对战**：与 AI 对手进行智能博弈

### 🤖 AI 难度
- **简单**：随机决策，适合新手练习
- **中等**：考虑手牌强度和赔率，适合进阶玩家
- **困难**：综合分析，高手挑战级别

### 🎯 游戏操作
- **弃牌 (Fold)**：放弃当前手牌
- **看牌 (Check)**：不做任何动作
- **跟注 (Call)**：匹配当前下注
- **加注 (Raise)**：增加下注金额
- **全下 (All-in)**：押上所有筹码

### 🃏 游戏流程
1. **Preflop (翻牌前)**：每位玩家发 2 张底牌
2. **Flop (翻牌)**：桌面公共牌 3 张
3. **Turn (转牌)**：桌面公共牌第 4 张
4. **River (河牌)**：桌面公共牌第 5 张
5. **Showdown (摊牌)**：比牌决定胜负

## 技术栈

- **前端框架**：Vue 3
- **构建工具**：Vite
- **游戏逻辑**：原生 JavaScript

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── ai/
│   └── AIPlayer.js       # AI 决策逻辑
├── components/
│   ├── ControlPanel.vue  # 操作控制面板
│   ├── GameSettings.vue  # 游戏设置
│   ├── PlayerSeat.vue    # 玩家座位
│   ├── PlayingCard.vue   # 扑克牌组件
│   ├── PokerTable.vue    # 扑克桌主组件
│   └── PotDisplay.vue    # 奖池显示
├── game/
│   ├── Deck.js           # 牌堆管理
│   ├── GameState.js      # 游戏状态
│   ├── HandEvaluator.js  # 手牌评估
│   └── PokerGame.js      # 游戏主逻辑
├── styles/
│   └── table.css         # 桌面样式
└── App.vue               # 应用入口
```

## License

MIT
