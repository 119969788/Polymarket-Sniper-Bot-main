# 实时日志查看指南

本指南介绍如何实时查看 Bot 的运行日志。

## 🚀 快速开始

### 方法 1：使用 PM2（推荐）

```bash
# 实时查看所有日志（推荐）
pm2 logs polymarket-sniper-bot --lines 0

# 查看最近 100 行，然后实时跟踪
pm2 logs polymarket-sniper-bot --lines 100

# 只查看错误日志（实时）
pm2 logs polymarket-sniper-bot --err --lines 0

# 只查看普通日志（实时）
pm2 logs polymarket-sniper-bot --out --lines 0
```

**退出**：按 `Ctrl+C`

### 方法 2：直接运行（开发模式）

```bash
# 开发模式，直接输出到终端
npm run dev

# 或生产模式
npm run build && npm start
```

### 方法 3：使用 tail 命令

```bash
# PM2 日志文件位置
tail -f ~/.pm2/logs/polymarket-sniper-bot-out.log

# 查看错误日志
tail -f ~/.pm2/logs/polymarket-sniper-bot-err.log

# 同时查看两个日志文件
tail -f ~/.pm2/logs/polymarket-sniper-bot-*.log
```

## 📋 日志类型

### 信息日志（INFO）
- 启动信息
- 配置信息
- 监控状态
- 交易检测和执行

### 警告日志（WARN）
- 余额不足警告
- 配置警告
- 市场状态警告

### 错误日志（ERROR）
- 执行失败
- 连接错误
- 余额验证失败

### 调试日志（DEBUG）
需要启用 `DEBUG=1` 或 `VERBOSE=1`

## 🔧 启用详细日志

在 `.env` 文件中添加：

```env
# 启用详细调试日志
DEBUG=1

# 或
VERBOSE=1
```

启用后会显示：
- API 请求详情
- 订单簿信息
- 市场验证状态
- 交易处理中间步骤

## 📊 日志示例

### 启动日志
```
[INFO] [2026-01-18T12:34:56.789Z] Starting Polymarket Frontrun Bot
[INFO] [2026-01-18T12:34:56.790Z] Monitoring 2 target address(es): 0xabc...,0xdef...
[INFO] [2026-01-18T12:34:56.791Z] Configuration - Fetch Interval: 1s, Min Trade Size: 100 USD
[INFO] [2026-01-18T12:34:56.792Z] ✅ Trade execution is ENABLED - Bot will execute trades automatically
[INFO] [2026-01-18T12:34:57.123Z] Wallet: 0x1234...
[INFO] [2026-01-18T12:34:57.124Z] POL Balance: 0.1234 POL
[INFO] [2026-01-18T12:34:57.125Z] USDC Balance: 1000.00 USDC
[INFO] [2026-01-18T12:34:57.126Z] Bot is running. Press Ctrl+C to stop gracefully.
[INFO] [2026-01-18T12:34:57.127Z] 📊 Logs are outputting in real-time. Monitor the console for trade signals.
```

### 交易检测日志
```
[INFO] [2026-01-18T12:35:01.234Z] [Frontrun] Detected pending trade: BUY 500.00 USD on market 0x123...
[INFO] [2026-01-18T12:35:01.235Z] [Frontrun] Trade details - Trader: 0xabc..., Token: 0x456..., Outcome: YES, Price: 0.65, TX: 0x789...
[INFO] [2026-01-18T12:35:01.345Z] [Frontrun] Balance check - POL: 0.1234 POL, USDC: 1000.00 USDC
[INFO] [2026-01-18T12:35:01.346Z] [Frontrun] Executing BUY 250.00 USD (target: 500.00 USD, multiplier: 0.5)
[INFO] [2026-01-18T12:35:01.347Z] [Frontrun] Trade details - Market: 0x123..., Token: 0x456..., Outcome: YES, Price: 0.65, Trader: 0xabc...
[INFO] [2026-01-18T12:35:02.567Z] [Frontrun] ✅ Successfully executed BUY order for 250.00 USD (execution time: 1220ms)
```

### 仅监控模式日志
```
[WARN] [2026-01-18T12:34:56.792Z] ⚠️  TRADE EXECUTION IS DISABLED - Monitoring only mode
[WARN] [2026-01-18T12:34:56.793Z] ⚠️  Bot will detect trades but will NOT execute any orders
[INFO] [2026-01-18T12:35:01.234Z] [Frontrun] Detected pending trade: BUY 500.00 USD on market 0x123...
[INFO] [2026-01-18T12:35:01.235Z] [Monitor Only] Trade detected but NOT executed: BUY 500.00 USD on market 0x123...
```

## 🛠️ 日志过滤

### 使用 grep 过滤

```bash
# 只看交易相关日志
pm2 logs polymarket-sniper-bot --lines 0 | grep "Frontrun"

# 只看错误
pm2 logs polymarket-sniper-bot --lines 0 | grep "ERROR"

# 只看交易执行成功
pm2 logs polymarket-sniper-bot --lines 0 | grep "Successfully executed"

# 排除调试信息
pm2 logs polymarket-sniper-bot --lines 0 | grep -v "DEBUG"
```

### 保存日志到文件

```bash
# 保存所有日志
pm2 logs polymarket-sniper-bot --lines 0 > bot_logs.txt

# 保存并实时查看
pm2 logs polymarket-sniper-bot --lines 0 | tee bot_logs.txt

# 只保存错误日志
pm2 logs polymarket-sniper-bot --err --lines 0 > error_logs.txt
```

## 📁 日志文件位置

### PM2 日志
- 标准输出：`~/.pm2/logs/polymarket-sniper-bot-out.log`
- 错误输出：`~/.pm2/logs/polymarket-sniper-bot-err.log`
- 合并日志：`~/.pm2/logs/polymarket-sniper-bot.log`

### 查看日志文件
```bash
# 查看最后 100 行
tail -n 100 ~/.pm2/logs/polymarket-sniper-bot-out.log

# 实时查看（实时输出）
tail -f ~/.pm2/logs/polymarket-sniper-bot-out.log

# 搜索特定内容
grep "Frontrun" ~/.pm2/logs/polymarket-sniper-bot-out.log

# 查看特定时间的日志
grep "2026-01-18T12:35" ~/.pm2/logs/polymarket-sniper-bot-out.log
```

## 🔍 日志分析技巧

### 1. 统计交易次数
```bash
grep "Successfully executed" ~/.pm2/logs/polymarket-sniper-bot-out.log | wc -l
```

### 2. 查看今天的交易
```bash
grep "$(date +%Y-%m-%d)" ~/.pm2/logs/polymarket-sniper-bot-out.log | grep "Successfully executed"
```

### 3. 查找错误
```bash
grep "ERROR" ~/.pm2/logs/polymarket-sniper-bot-err.log | tail -20
```

### 4. 监控实时性能
```bash
# 使用 PM2 监控面板
pm2 monit
```

## 📝 日志级别说明

| 级别 | 说明 | 默认显示 |
|------|------|---------|
| INFO | 一般信息，正常运行日志 | ✅ 是 |
| WARN | 警告信息，需要注意但不影响运行 | ✅ 是 |
| ERROR | 错误信息，需要关注的问题 | ✅ 是 |
| DEBUG | 调试信息，详细的内部状态 | ❌ 需启用 DEBUG=1 |

## ⚙️ 日志配置

### 设置日志保留时间（PM2）

```bash
# 设置日志保留 7 天
pm2 install pm2-logrotate
pm2 set pm2-logrotate:retain 7

# 设置最大日志文件大小
pm2 set pm2-logrotate:max_size 10M
```

### 禁用日志文件（仅控制台输出）

```bash
pm2 start dist/app/main.js --name polymarket-sniper-bot --log-date-format="YYYY-MM-DD HH:mm:ss Z" --no-autorestart
```

## 🚨 常见问题

### Q: 日志没有实时输出？

**A:** 确保使用以下命令：
```bash
# 使用 --lines 0 参数
pm2 logs polymarket-sniper-bot --lines 0
```

### Q: 日志太多，如何过滤？

**A:** 使用 grep 过滤：
```bash
pm2 logs polymarket-sniper-bot --lines 0 | grep "Frontrun"
```

### Q: 如何查看历史日志？

**A:** 直接查看日志文件：
```bash
cat ~/.pm2/logs/polymarket-sniper-bot-out.log | less
```

### Q: 日志文件太大怎么办？

**A:** 使用 pm2-logrotate 自动管理日志大小和保留时间。

## 💡 提示

1. **实时监控**：使用 `pm2 logs --lines 0` 查看实时日志
2. **调试模式**：设置 `DEBUG=1` 查看详细调试信息
3. **日志文件**：定期清理日志文件以节省磁盘空间
4. **错误追踪**：关注 ERROR 级别的日志，及时处理问题

---

**推荐命令**：实时查看所有日志
```bash
pm2 logs polymarket-sniper-bot --lines 0
```
