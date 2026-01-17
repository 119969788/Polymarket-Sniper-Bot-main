#!/bin/bash

# Polymarket Sniper Bot - 一键安装脚本
# 适用于 Ubuntu/Debian/CentOS/RHEL 服务器

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -eq 0 ]; then 
        print_warning "检测到 root 用户，建议使用普通用户运行此脚本"
    fi
}

# 检测操作系统
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        print_info "检测到操作系统: $OS $OS_VERSION"
    else
        print_error "无法检测操作系统类型"
        exit 1
    fi
}

# 安装 Node.js 18+
install_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            print_success "Node.js 已安装，版本: $(node -v)"
            return 0
        else
            print_warning "Node.js 版本过低 ($(node -v))，需要 18+，将进行更新"
        fi
    else
        print_info "未检测到 Node.js，开始安装 Node.js 20..."
    fi

    print_info "正在安装 Node.js 20..."
    
    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
        # CentOS/RHEL/Fedora
        curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
        sudo yum install -y nodejs
    else
        print_error "不支持的操作系统: $OS"
        print_info "请手动安装 Node.js 18+，然后重新运行此脚本"
        exit 1
    fi

    print_success "Node.js 安装完成，版本: $(node -v)"
    print_success "npm 版本: $(npm -v)"
}

# 安装 PM2 进程管理器
install_pm2() {
    if command -v pm2 &> /dev/null; then
        print_success "PM2 已安装，版本: $(pm2 -v)"
    else
        print_info "正在安装 PM2 进程管理器..."
        sudo npm install -g pm2
        print_success "PM2 安装完成"
    fi
}

# 安装 Git（如果需要）
install_git() {
    if command -v git &> /dev/null; then
        print_success "Git 已安装，版本: $(git --version)"
    else
        print_info "正在安装 Git..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            sudo apt-get update
            sudo apt-get install -y git
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ] || [ "$OS" = "fedora" ]; then
            sudo yum install -y git
        fi
        print_success "Git 安装完成"
    fi
}

# 克隆或更新仓库
setup_repository() {
    REPO_URL="https://github.com/119969788/Polymarket-Sniper-Bot-main.git"
    PROJECT_DIR="polymarket-sniper-bot"
    
    if [ -d "$PROJECT_DIR" ]; then
        print_warning "项目目录已存在，正在更新..."
        cd "$PROJECT_DIR"
        git pull || print_warning "Git 拉取失败，继续使用现有代码"
        cd ..
    else
        print_info "正在克隆仓库..."
        git clone "$REPO_URL" "$PROJECT_DIR" || {
            print_error "克隆仓库失败，请检查网络连接或仓库地址"
            exit 1
        }
        print_success "仓库克隆完成"
    fi
    
    cd "$PROJECT_DIR"
}

# 安装项目依赖
install_dependencies() {
    print_info "正在安装项目依赖（这可能需要几分钟）..."
    npm install
    print_success "依赖安装完成"
}

# 构建项目
build_project() {
    print_info "正在构建项目..."
    npm run build
    print_success "项目构建完成"
}

# 配置环境变量
setup_env() {
    ENV_FILE=".env"
    
    if [ -f "$ENV_FILE" ]; then
        print_warning ".env 文件已存在，跳过创建"
        print_info "如果需要更新配置，请手动编辑 .env 文件"
        return 0
    fi

    print_info "正在创建 .env 配置文件..."
    
    cat > "$ENV_FILE" << 'EOF'
# Polymarket Sniper Bot 配置文件
# 请填写以下必需的配置项

# ========== 必需配置 ==========
# 目标地址列表（逗号分隔，至少需要一个）
TARGET_ADDRESSES=

# 你的钱包公钥（地址）
PUBLIC_KEY=

# 你的钱包私钥
PRIVATE_KEY=

# Polygon RPC 端点（必须支持待处理交易监控）
RPC_URL=

# ========== 可选配置 ==========
# 轮询间隔（秒）
FETCH_INTERVAL=1

# 交易倍数（例如: 1.0, 2.0）
TRADE_MULTIPLIER=1.0

# 重试次数限制
RETRY_LIMIT=3

# 最小交易规模（USD）
MIN_TRADE_SIZE_USD=100

# Frontrun 规模倍数（0.0-1.0，例如: 0.5 = 目标交易的50%）
FRONTRUN_SIZE_MULTIPLIER=0.5

# Gas 价格倍数（例如: 1.2 = 比目标高20%）
GAS_PRICE_MULTIPLIER=1.2

# USDC 合约地址（默认: Polygon 主网）
USDC_CONTRACT_ADDRESS=0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174

# MongoDB URI（可选，用于数据存储）
# MONGO_URI=

# Polymarket API 密钥（可选）
# POLYMARKET_API_KEY=
# POLYMARKET_API_SECRET=
# POLYMARKET_API_PASSPHRASE=

# 交易聚合（可选）
# TRADE_AGGREGATION_ENABLED=false
# TRADE_AGGREGATION_WINDOW_SECONDS=5
EOF

    print_success ".env 文件已创建"
    print_warning "请编辑 .env 文件填写必需的配置项："
    print_warning "  - TARGET_ADDRESSES: 目标地址列表（逗号分隔）"
    print_warning "  - PUBLIC_KEY: 你的钱包地址"
    print_warning "  - PRIVATE_KEY: 你的钱包私钥"
    print_warning "  - RPC_URL: Polygon RPC 端点"
}

# 创建启动脚本
create_start_script() {
    print_info "正在创建启动脚本..."
    
    cat > start.sh << 'EOF'
#!/bin/bash

# Polymarket Sniper Bot - 启动脚本

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "错误: .env 文件不存在"
    echo "请先运行 install.sh 完成配置"
    exit 1
fi

# 检查是否已构建
if [ ! -d dist ]; then
    echo "错误: 项目尚未构建"
    echo "请运行: npm run build"
    exit 1
fi

echo "正在启动 Polymarket Sniper Bot..."

# 使用 PM2 启动（推荐）
if command -v pm2 &> /dev/null; then
    pm2 start dist/app/main.js --name polymarket-sniper-bot --env production
    echo "Bot 已在 PM2 中启动"
    echo "查看日志: pm2 logs polymarket-sniper-bot"
    echo "查看状态: pm2 status"
    echo "停止 Bot: pm2 stop polymarket-sniper-bot"
    echo "重启 Bot: pm2 restart polymarket-sniper-bot"
else
    # 直接运行
    node dist/app/main.js
fi
EOF

    chmod +x start.sh
    print_success "启动脚本已创建: start.sh"
}

# 创建停止脚本
create_stop_script() {
    print_info "正在创建停止脚本..."
    
    cat > stop.sh << 'EOF'
#!/bin/bash

# Polymarket Sniper Bot - 停止脚本

if command -v pm2 &> /dev/null; then
    pm2 stop polymarket-sniper-bot
    echo "Bot 已停止"
else
    echo "PM2 未安装，请手动停止进程 (Ctrl+C 或 kill 命令)"
fi
EOF

    chmod +x stop.sh
    print_success "停止脚本已创建: stop.sh"
}

# 主安装流程
main() {
    echo ""
    echo "=========================================="
    echo "  Polymarket Sniper Bot - 一键安装脚本"
    echo "=========================================="
    echo ""
    
    check_root
    detect_os
    
    print_info "开始安装流程..."
    echo ""
    
    # 安装必要工具
    install_git
    install_nodejs
    install_pm2
    
    echo ""
    print_info "设置项目..."
    
    # 设置项目
    setup_repository
    install_dependencies
    build_project
    setup_env
    
    echo ""
    print_info "创建管理脚本..."
    
    # 创建脚本
    create_start_script
    create_stop_script
    
    echo ""
    echo "=========================================="
    print_success "安装完成！"
    echo "=========================================="
    echo ""
    print_info "下一步操作："
    echo "  1. 编辑 .env 文件填写必需的配置"
    echo "     nano .env 或 vi .env"
    echo ""
    echo "  2. 启动 Bot："
    echo "     ./start.sh"
    echo ""
    echo "  3. 查看 PM2 日志："
    echo "     pm2 logs polymarket-sniper-bot"
    echo ""
    echo "  4. 查看 PM2 状态："
    echo "     pm2 status"
    echo ""
    echo "  5. 停止 Bot："
    echo "     ./stop.sh 或 pm2 stop polymarket-sniper-bot"
    echo ""
    print_warning "重要：请确保在启动前填写 .env 文件中的所有必需配置项！"
    echo ""
}

# 运行主函数
main
