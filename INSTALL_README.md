# 服务器一键安装指南

## 📋 简介

`install.sh` 是一个自动化安装脚本，用于在 Linux 服务器上快速部署 Polymarket Sniper Bot。

## 🚀 快速开始

### 在服务器上运行

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/119969788/Polymarket-Sniper-Bot-main/main/install.sh | bash

# 或者先下载脚本，再运行
wget https://raw.githubusercontent.com/119969788/Polymarket-Sniper-Bot-main/main/install.sh
chmod +x install.sh
./install.sh
```

### 手动克隆后运行

```bash
# 克隆仓库
git clone https://github.com/119969788/Polymarket-Sniper-Bot-main.git
cd Polymarket-Sniper-Bot-main

# 运行安装脚本
chmod +x install.sh
./install.sh
```

## 📦 脚本功能

安装脚本会自动完成以下操作：

1. ✅ **检测操作系统** - 自动识别 Ubuntu/Debian/CentOS/RHEL
2. ✅ **安装 Node.js 20** - 确保 Node.js 版本 >= 18
3. ✅ **安装 PM2** - 进程管理器，用于后台运行
4. ✅ **安装 Git** - 用于克隆仓库
5. ✅ **克隆/更新仓库** - 获取最新代码
6. ✅ **安装依赖** - 自动安装 npm 依赖包
7. ✅ **构建项目** - 编译 TypeScript 代码
8. ✅ **创建配置文件** - 自动创建 `.env` 模板
9. ✅ **创建管理脚本** - 生成 `start.sh` 和 `stop.sh`

## ⚙️ 配置说明

安装完成后，需要编辑 `.env` 文件填写必需的配置：

```bash
nano .env
# 或
vi .env
```

### 必需配置项

```env
# 目标地址列表（逗号分隔，至少需要一个）
TARGET_ADDRESSES=0xabc...,0xdef...

# 你的钱包公钥（地址）
PUBLIC_KEY=your_wallet_address

# 你的钱包私钥
PRIVATE_KEY=your_private_key

# Polygon RPC 端点（必须支持待处理交易监控）
RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
```

### 推荐的 RPC 提供商

- **Infura**: https://infura.io/
- **Alchemy**: https://www.alchemy.com/
- **QuickNode**: https://www.quicknode.com/
- **Polygon 官方**: https://polygon.technology/

## 🎮 使用方法

### 启动 Bot

```bash
./start.sh
```

### 使用 PM2 管理

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs polymarket-sniper-bot

# 查看实时日志
pm2 logs polymarket-sniper-bot --lines 100

# 停止 Bot
pm2 stop polymarket-sniper-bot

# 重启 Bot
pm2 restart polymarket-sniper-bot

# 删除进程
pm2 delete polymarket-sniper-bot
```

### 停止 Bot

```bash
./stop.sh
# 或
pm2 stop polymarket-sniper-bot
```

## 🔧 系统要求

- **操作系统**: Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+
- **Node.js**: 18.0.0 或更高版本（脚本会自动安装 Node.js 20）
- **内存**: 至少 512MB RAM
- **磁盘**: 至少 1GB 可用空间
- **网络**: 稳定的互联网连接

## 📝 常见问题

### Q: 安装过程中遇到权限错误怎么办？

A: 如果提示权限不足，可以在命令前加上 `sudo`：

```bash
sudo ./install.sh
```

### Q: 如何更新到最新版本？

A: 进入项目目录，拉取最新代码并重新构建：

```bash
cd polymarket-sniper-bot
git pull
npm install
npm run build
pm2 restart polymarket-sniper-bot
```

### Q: PM2 开机自启动如何设置？

A: 运行以下命令让 PM2 在服务器重启后自动启动：

```bash
pm2 startup
# 按照提示执行生成的命令
pm2 save
```

### Q: 如何查看详细的错误日志？

A: 使用 PM2 查看日志：

```bash
pm2 logs polymarket-sniper-bot --err
```

### Q: 配置环境变量后需要重启吗？

A: 是的，修改 `.env` 文件后需要重启 Bot：

```bash
pm2 restart polymarket-sniper-bot
```

## 🛠️ 手动安装（不使用脚本）

如果不使用自动化脚本，可以手动执行以下步骤：

```bash
# 1. 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. 安装 PM2
sudo npm install -g pm2

# 3. 克隆仓库
git clone https://github.com/119969788/Polymarket-Sniper-Bot-main.git
cd Polymarket-Sniper-Bot-main

# 4. 安装依赖
npm install

# 5. 构建项目
npm run build

# 6. 配置环境变量
cp .env.example .env
nano .env  # 编辑配置文件

# 7. 启动 Bot
pm2 start dist/app/main.js --name polymarket-sniper-bot
```

## 📚 更多信息

- 完整文档: [README.md](./README.md)
- 使用指南: [docs/GUIDE.md](./docs/GUIDE.md)
- 贡献指南: [CONTRIBUTING.md](./CONTRIBUTING.md)

## ⚠️ 注意事项

1. **私钥安全**: 请妥善保管 `.env` 文件中的私钥，不要泄露给他人
2. **网络安全**: 建议将 `.env` 文件添加到 `.gitignore`（已默认添加）
3. **测试环境**: 建议先在测试网络上测试，确认无误后再在主网使用
4. **监控运行**: 定期检查 Bot 运行状态和日志，确保正常工作

## 📞 获取帮助

如果遇到问题，可以通过以下方式获取帮助：

- 📱 Telegram: [t.me/novustch](https://t.me/novustch)
- 📲 WhatsApp: [wa.me/14105015750](https://wa.me/14105015750)
- 💬 Discord: [discordapp.com/users/985432160498491473](https://discordapp.com/users/985432160498491473)

---

**祝您使用愉快！** 🚀
