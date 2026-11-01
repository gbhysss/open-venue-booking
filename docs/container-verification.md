# 容器验收与本机演示

v0.2.2 在 GitHub Actions 增加独立的 `Docker Compose deployment` 任务。应用提交 `728b33d` 的全部检查已成功：[查看 CI 记录](https://github.com/gbhysss/open-venue-booking/actions/runs/41266819211)。

## 验收内容

- 使用项目自己的 Dockerfile 构建运行镜像和 maintenance 镜像。
- 检查正式 Compose 不暴露数据库端口，应用只绑定本机 127.0.0.1。
- 构建前创建虚构的 `.env.production.local` 哨兵文件，验证它没有进入构建或运行镜像。
- 验证应用进程以非 root 用户运行。
- 在全新 PostgreSQL 17 容器初始化数据库，重复执行幂等迁移，创建虚构管理员并添加演示场馆。
- 在真实容器中完成登录、授权、场馆更新、分页、审批、私密查询和提交配额等 HTTP 回归。
- 停止数据库时，`/api/health` 返回 503；重启后恢复 200，演示数据保留，应用无需重启。

`docker-compose.test.yml` 只用于隔离测试，临时把测试数据库暴露到本机端口供测试客户端使用。不要将它用于正式部署。

测试脚本要求 `CI=true`，为每次运行生成随机 Compose 项目名，只清理本次创建的容器、网络和卷。它拒绝覆盖已经存在的 `.env.production.local`，也不操作真实业务数据。

## 在 Mac 本机演示

前提：安装并启动 Docker Desktop。本次工作不会自动为你的 Mac 安装 Docker，也不会把演示开放到公网。

在一个全新目录中运行：

```bash
git clone https://github.com/gbhysss/open-venue-booking.git
cd open-venue-booking
bash scripts/setup-docker.sh
```

仓库目前是私有仓库，克隆需要你已登录的 GitHub 身份。初始化时输入自己选择的管理员邮箱及至少 12 位密码，并在添加虚构演示场馆时选择 `y`。脚本会等待数据库和应用就绪。

打开 `http://localhost:3000` 浏览三个虚构场馆，打开 `/login` 使用刚创建的管理员账号。可以提交虚构预约，在后台审批，再用提交后生成的私密链接查询。

检查状态：

```bash
docker compose ps
curl --fail http://localhost:3000/api/health
```

预期返回 `{"status":"ok"}`。503 只表示尚未就绪，不会返回数据库地址、密码或人员信息。

演示结束后：

```bash
docker compose down
```

这个命令保留数据库卷；以后用 `docker compose up -d --wait` 启动。不要在有数据的部署中使用 `down -v`。

## 已有 v0.2.1 部署

备份本项目数据库、保留现有 `.env` 后，在更新源码的目录中执行：

```bash
docker compose --profile tools build
docker compose --profile tools run --rm maintenance npm run db:migrate
docker compose up -d --wait --wait-timeout 90 app
```

v0.2.2 没有新增数据迁移；不需要重新创建管理员或重复添加演示数据。

## 公网演示

本机演示不产生公网地址。公开部署还需要明确的服务器、域名、HTTPS 和访问策略。当前仓库保持 Private，演示使用虚构数据；不要把原业务系统的数据库或密钥复制进来。
