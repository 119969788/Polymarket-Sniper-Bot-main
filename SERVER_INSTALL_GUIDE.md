# 服务器安装教程

本教程将指导您在 Linux 服务器上安装和配置 Polymarket Sniper Bot。

## 📋 目录

- [系统要求](#系统要求)
- [快速安装（一键脚本）](#快速安装一键脚本)
- [手动安装](#手动安装)
- [配置说明](#配置说明)
- [启动和管理](#启动和管理)
- [常见问题](#常见问题)

---

## 🔧 系统要求

### 最低配置

- **操作系统**: Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+
- **内存**: 512MB RAM（推荐 1GB+）
- **磁盘**: 1GB 可用空间
- **网络**: 稳定的互联网连接
- **Node.js**: 18.0.0 或更高版本（脚本会自动安装）

### 必需工具

- `curl` 或 `wget`
- `git`
- `sudo` 权限（用于安装依赖）

---

## 🚀 快速安装（一键脚本）

### 方法 1：直接下载运行

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/119969788/Polymarket-Sniper-Bot-main/main/install.sh | bash
```

### 方法 2：先下载再运行

```bash
# 下载安装脚本
wget https://raw.githubusercontent.com/119969788/Polymarket-Sniper-Bot-main/main/install.sh

# 添加执行权限
chmod +x install.sh

# 运行安装脚本
./install.sh
```

安装脚本会自动完成以下操作：
- ✅ 检测操作系统
- ✅ 安装 Node.js 20
- ✅ 安装 PM2 进程管理器
- ✅ 安装 Git（如需要）
- ✅ 克隆项目代码
- ✅ 安装依赖包
- ✅ 构建项目
- ✅ 创建配置文件模板
- ✅ 创建启动/停止脚本

---

## 📝 手动安装

如果您希望逐步安装或自定义安装过程，请按照以下步骤操作：

### 步骤 1：更新系统

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

#### CentOS/RHEL

```bash
sudo yum update -y
```

### 步骤 2：安装 Node.js 20

#### Ubuntu/Debian

```bash
# 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 安装 Node.js
sudo apt-get install -y nodejs

# 验证安装
node -v
npm -v
```

#### CentOS/RHEL

```bash
# 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# 安装 Node.js
sudo yum install -y nodejs

# 验证安装
node -v
npm -v
```

**预期输出**：
```
v20.x.x
10.x.x
```

### 步骤 3：安装 PM2 进程管理器

```bash
# 全局安装 PM2
sudo npm install -g pm2

# 验证安装
pm2 -v
```

### 步骤 4：安装 Git（如未安装）

#### Ubuntu/Debian

```bash
sudo apt-get install -y git
```

#### CentOS/RHEL

```bash
sudo yum install -y git
```

### 步骤 5：克隆项目

```bash
# 克隆仓库
git clone https://github.com/119969788/Polymarket-Sniper-Bot-main.git

# 进入项目目录
cd Polymarket-Sniper-Bot-main
```

### 步骤 6：安装依赖

```bash
# 安装项目依赖（这可能需要几分钟）
npm install
```

### 步骤 7：构建项目

```bash
# 编译 TypeScript 代码
npm run build
```

### 步骤 8：创建配置文件

```bash
# 复制配置模板（如果存在）
# 或者直接创建 .env 文件
nano .env
```

在 `.env` 文件中添加以下配置：

```env
# 必需配置
TARGET_ADDRESSES=0x1234...,0x5678...    # 目标地址列表（逗号分隔）
PUBLIC_KEY=your_wallet_address          # 你的钱包地址
PRIVATE_KEY=your_private_key            # 你的钱包私钥
RPC_URL=https://polygon-mainnet...      # Polygon RPC 端点

# 可选配置
FETCH_INTERVAL=1                        # 轮询间隔（秒）
MIN_TRADE_SIZE_USD=100                 # 最小交易规模（USD）
FRONTRUN_SIZE_MULTIPLIER=0.5           # Frontrun 规模倍数
GAS_PRICE_MULTIPLIER=1.2               # Gas 价格倍数
```

### 步骤 9：验证配置

```bash
# 检查配置是否正确
npm run build
node dist/app/main.js
# 按 Ctrl+C 退出测试
```

---

## ⚙️ 配置说明

### 必需配置项

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `TARGET_ADDRESSES` | 要监控的目标地址列表（逗号分隔，至少一个） | `0xabc...,0xdef...` |
| `PUBLIC_KEY` | 你的钱包地址（公钥） | `0x1234...` |
| `PRIVATE_KEY` | 你的钱包私钥（64字符十六进制） | `abcd1234...` |
| `RPC_URL` | Polygon RPC 端点（必须支持待处理交易监控） | `https://polygon-mainnet.infura.io/v3/YOUR_KEY` |

### 可选配置项

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `FETCH_INTERVAL` | `1` | 轮询间隔（秒），范围：0.1-60 |
| `MIN_TRADE_SIZE_USD` | `100` | 最小交易规模（USD），范围：0-1000000 |
| `FRONTRUN_SIZE_MULTIPLIER` | `0.5` | Frontrun 规模倍数，范围：0-1 |
| `GAS_PRICE_MULTIPLIER` | `1.2` | Gas 价格倍数（1.2 = 20%更高），范围：1-5 |
| `RETRY_LIMIT` | `3` | 最大重试次数，范围：1-10 |
| `USDC_CONTRACT_ADDRESS` | `0x2791Bca1...` | USDC 合约地址（Polygon 主网） |

### 配置验证

程序启动时会自动验证配置：
- ✅ 地址格式验证（0x + 40个十六进制字符）
- ✅ 私钥格式验证（64个十六进制字符）
- ✅ RPC URL 格式验证
- ✅ 数值范围验证

### 获取 RPC 端点

推荐使用的 RPC 提供商：

1. **Infura**: https://infura.io/
   - 注册账户 → 创建项目 → 获取 Polygon 主网 RPC URL

2. **Alchemy**: https://www.alchemy.com/
   - 注册账户 → 创建应用 → 获取 HTTP URL

3. **QuickNode**: https://www.quicknode.com/
   - 注册账户 → 创建端点 → 获取 RPC URL

4. **Polygon 官方 RPC**（可能有速率限制）
   - `https://polygon-rpc.com`

---

## 🎮 启动和管理

### 方法 1：使用 PM2（推荐）

#### 启动 Bot

```bash
# 使用 PM2 启动
pm2 start dist/app/main.js --name polymarket-sniper-bot

# 或者使用 npm 脚本
pm2 start npm --name polymarket-sniper-bot -- start
```

#### 查看状态

```bash
# 查看所有进程
pm2 status

# 查看详细信息
pm2 info polymarket-sniper-bot
```

#### 查看日志

```bash
# 查看实时日志
pm2 logs polymarket-sniper-bot

# 查看最近 100 行日志
pm2 logs polymarket-sniper-bot --lines 100

# 只查看错误日志
pm2 logs polymarket-sniper-bot --err
```

#### 停止/重启

```bash
# 停止 Bot
pm2 stop polymarket-sniper-bot

# 重启 Bot
pm2 restart polymarket-sniper-bot

# 删除进程
pm2 delete polymarket-sniper-bot
```

#### 开机自启动

```bash
# 生成启动脚本
pm2 startup

# 按照输出的提示执行命令（通常需要 sudo）
# 示例：sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# 保存当前进程列表
pm2 save
```

### 方法 2：使用 npm 脚本

```bash
# 开发模式
npm run dev

# 生产模式
npm run build && npm start
```

### 方法 3：使用 systemd（高级）

创建 systemd 服务文件：

```bash
sudo nano /etc/systemd/system/polymarket-bot.service
```

添加以下内容（修改路径和用户）：

```ini
[Unit]
Description=Polymarket Sniper Bot
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/Polymarket-Sniper-Bot-main
ExecStart=/usr/bin/node dist/app/main.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable polymarket-bot

# 启动服务
sudo systemctl start polymarket-bot

# 查看状态
sudo systemctl status polymarket-bot

# 查看日志
sudo journalctl -u polymarket-bot -f
```

---

## 🔍 监控和故障排除

### 检查运行状态

```bash
# PM2 方式
pm2 status
pm2 logs polymarket-sniper-bot --lines 50

# systemd 方式
sudo systemctl status polymarket-bot
sudo journalctl -u polymarket-bot -n 50
```

### 常见问题诊断

#### 1. Bot 无法启动

**检查配置**：
```bash
# 验证 .env 文件是否存在
ls -la .env

# 检查配置格式
cat .env | grep -v "^#" | grep -v "^$"
```

**检查错误日志**：
```bash
pm2 logs polymarket-sniper-bot --err
```

#### 2. 连接 RPC 失败

**测试 RPC 连接**：
```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  YOUR_RPC_URL
```

**检查网络**：
```bash
# 测试网络连接
ping polygon-rpc.com
```

#### 3. 内存使用过高

**查看内存使用**：
```bash
pm2 monit
# 或
free -h
```

**重启服务释放内存**：
```bash
pm2 restart polymarket-sniper-bot
```

#### 4. 交易执行失败

**检查余额**：
- 确保 USDC 余额充足
- 确保 POL/MATIC 余额至少 0.05（用于 gas 费用）

**查看详细日志**：
```bash
pm2 logs polymarket-sniper-bot --lines 200
```

---

## 📊 性能优化建议

### 1. 调整轮询间隔

```env
# 更快的响应（但增加 API 调用）
FETCH_INTERVAL=0.5

# 平衡性能和延迟
FETCH_INTERVAL=1

# 减少 API 调用（但可能错过机会）
FETCH_INTERVAL=2
```

### 2. 优化 Gas 价格

```env
# 更激进的 frontrunning（更高成本）
GAS_PRICE_MULTIPLIER=1.5

# 平衡成本和速度
GAS_PRICE_MULTIPLIER=1.2

# 保守策略
GAS_PRICE_MULTIPLIER=1.1
```

### 3. 监控资源使用

```bash
# 实时监控
pm2 monit

# 查看统计信息
pm2 show polymarket-sniper-bot
```

---

## 🔄 更新程序

### 更新到最新版本

```bash
# 进入项目目录
cd Polymarket-Sniper-Bot-main

# 停止 Bot
pm2 stop polymarket-sniper-bot

# 拉取最新代码
git pull

# 更新依赖（如有变更）
npm install

# 重新构建
npm run build

# 重启 Bot
pm2 restart polymarket-sniper-bot

# 查看日志确认正常
pm2 logs polymarket-sniper-bot --lines 50
```

---

## 🛡️ 安全建议

### 1. 保护私钥

```bash
# 设置正确的文件权限
chmod 600 .env

# 确保 .env 在 .gitignore 中（已默认添加）
cat .gitignore | grep .env
```

### 2. 使用防火墙

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 22/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload
```

### 3. 定期备份

```bash
# 备份配置文件
cp .env .env.backup.$(date +%Y%m%d)
```

---

## 📞 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

- 📱 Telegram: [t.me/novustch](https://t.me/novustch)
- 📲 WhatsApp: [wa.me/14105015750](https://wa.me/14105015750)
- 💬 Discord: [discordapp.com/users/985432160498491473](https://discordapp.com/users/985432160498491473)
- 📧 查看项目 Issues: [GitHub Issues](https://github.com/119969788/Polymarket-Sniper-Bot-main/issues)

---

## 📚 相关文档

- [README.md](./README.md) - 项目概览和功能说明
- [OPTIMIZATION_SUMMARY.md](./OPTIMIZATION_SUMMARY.md) - 性能优化说明
- [INSTALL_README.md](./INSTALL_README.md) - 安装脚本说明

---

## ✅ 安装检查清单

在启动 Bot 之前，请确认：

- [ ] Node.js 18+ 已安装
- [ ] PM2 已安装
- [ ] 项目依赖已安装
- [ ] 项目已构建（`dist` 目录存在）
- [ ] `.env` 文件已创建并配置
- [ ] 钱包地址格式正确
- [ ] 私钥格式正确（64字符十六进制）
- [ ] RPC URL 可访问
- [ ] 钱包有足够的 USDC 余额
- [ ] 钱包有足够的 POL/MATIC 余额（至少 0.05）

---

**祝您使用愉快！** 🚀

如有任何问题，请随时查阅文档或联系支持团队。
