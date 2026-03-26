# 阿里云 Ubuntu 24.04 部署指南

本指南将指导您如何使用 Docker 和 Docker Compose 将此任务进度管理工具部署到阿里云的 Ubuntu 24.04 服务器上。

## 1. 准备工作 (在阿里云服务器上执行)

首先，通过 SSH 登录到您的阿里云服务器，并安装 Docker 和 Docker Compose。

### 1.1 更新系统并安装必要的工具
```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git
```

### 1.2 安装 Docker
```bash
# 下载并运行 Docker 安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 启动 Docker 并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# (可选) 将当前用户加入 docker 组，这样运行 docker 命令就不需要加 sudo 了
sudo usermod -aG docker $USER
# 注意：执行完上述命令后，您需要退出 SSH 并重新登录才能生效
```

### 1.3 安装 Docker Compose
Ubuntu 24.04 源中通常已经包含了 docker-compose-plugin：
```bash
sudo apt install -y docker-compose-plugin
```
验证安装：
```bash
docker compose version
```

## 2. 上传代码到服务器

您需要将本地的代码（整个 `oversee` 文件夹）上传到阿里云服务器。

### 方法 A：使用 Git (推荐)
如果您已经将代码推送到 GitHub/Gitee：
```bash
git clone <您的仓库地址>
cd oversee
```

### 方法 B：使用 SCP 或 SFTP 工具
如果您不使用 Git，可以使用 SCP 命令或工具（如 FileZilla、Xftp）将本地的 `oversee` 文件夹上传到服务器的 `~` (用户主目录) 下。

```bash
# 在您的本地电脑上执行 (假设服务器IP为 123.45.67.89，用户为 root)
scp -r ./oversee root@123.45.67.89:~/
```

## 3. 开始部署

进入服务器上的代码目录：
```bash
cd ~/oversee
```

### 3.1 确保数据库持久化目录存在
为了防止容器重启导致数据丢失，我们需要在宿主机上创建一个目录来映射数据库文件：
```bash
mkdir -p data
```

### 3.2 使用 Docker Compose 一键启动
运行以下命令，Docker 会自动拉取环境、编译前端、打包后端并启动服务：
```bash
sudo docker compose up -d --build
```
*(注意：如果前面没有配置免 sudo 权限，记得加 sudo；这里的 `docker compose` 中间是空格，不是连字符)*

### 3.3 检查运行状态
```bash
sudo docker compose ps
```
如果看到 `oversee-frontend` 和 `oversee-backend` 的状态都是 `Up`，说明启动成功！

## 4. 访问系统

部署成功后，前端服务运行在服务器的 `80` 端口。

1. **配置阿里云安全组**：登录阿里云控制台，进入该服务器的实例详情 -> 安全组 -> 规则配置，**放行入方向的 HTTP (80) 端口**。
2. **浏览器访问**：在浏览器中直接输入您的服务器公网 IP 地址即可访问：
   `http://<您的服务器公网IP>`

默认登录账号（首次部署后会自动创建）：
- 用户名：`caorentuo`
- 密码：`linkinpark1`
- 验证码：`HHL124`

---

## 常见问题排查

**1. 页面无法访问？**
- 检查阿里云安全组 80 端口是否开放。
- 检查服务器内部防火墙（如 ufw）是否开放了 80 端口：`sudo ufw allow 80/tcp`

**2. 提示接口报错 / 保存失败？**
- 查看后端日志：`sudo docker compose logs -f backend`
- 确认 Nginx 反向代理配置生效，前端发出的请求应该是不带 `http://localhost:8000` 的相对路径。

**3. 如何更新代码？**
如果您修改了代码，只需重新上传到服务器，然后再次执行：
```bash
sudo docker compose up -d --build
```
Docker 会自动重新构建并平滑重启服务。
