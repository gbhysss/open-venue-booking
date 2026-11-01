# OpenVenue 开源场馆预约系统

**面向高校、社区、公共机构及中小组织的免费、自托管场馆预约与审批系统。**

> **当前状态：v0.2.2 容器预览版。** 已完成依赖安装、类型检查、生产构建、原生 PostgreSQL 17 与本机 API 回归验证；详情及未验证范围见 `QUALITY_STATUS.md`。Docker/Linux 部署仍需验证。

## 已实现的功能

- **访客端：** 公开场馆列表、场馆详情、手机/电脑预约申请；不强制注册账号。
- **时段查看：** 展示已批准预约的占用时间，不暴露其他申请人的个人信息。
- **私密查询：** 申请成功后生成随机查询令牌，持有私密链接才可查看审批状态。
- **管理员端：** 独立登录、场馆新增/暂停、预约查看、批准/驳回及备注。
- **重复预约保护：** PostgreSQL 的数据库级时间段排他约束阻止同一场馆时段重复审批。
- **安全基础：** Better Auth 处理会话与密码，不开放线上自主注册；后台接口服务器端校验管理员身份。
- **部署支持：** 提供 Docker Compose、数据库初始化 SQL、开发脚本与示例场馆数据。

## 与原项目关系

这是**全新独立项目**，仅参考通用业务需求。没有迁移 `gbhysss/yycg` 的代码提交历史、真实业务数据库、学校个人信息、钉钉 Webhook、学校 LOGO 或原有运行配置。原仓库不需要公开，也不需要修改。

## 环境

- Node.js 22+
- PostgreSQL 17+
- npm
- 支持 Docker Compose（推荐单机构自部署）

## Mac 一键本地安装（需要安装 Docker Desktop）

```bash
bash scripts/setup-docker.sh
```

此脚本会在全新目录里生成随机数据库密码和登录密钥，初始化数据库，并交互式创建管理员。已有 `.env` 时不会覆盖配置。安装依赖和构建需联网。

## 本地启动

```bash
cp .env.example .env
# 编辑 .env，配置 DATABASE_URL、BETTER_AUTH_SECRET、BETTER_AUTH_URL
npm ci
npm run db:migrate
# 先临时设置 ADMIN_EMAIL、ADMIN_PASSWORD 环境变量
npm run admin:create
npm run dev
```

浏览器访问 `http://localhost:3000`。请先配置数据库、安装依赖并创建管理员。管理员注册仅允许命令行执行，线上注册入口关闭。

详细安装、Docker 命令、使用限制与验收步骤请阅读 [docs/installation.md](docs/installation.md)。

## 部署安全说明

1. **不能直接公开测试版**：必须先完成依赖安装、构建、测试和人工审查。
2. 生产环境必须使用 HTTPS、反向代理和独立强密码；公开申请接口应设置代理层限流。
3. 密码与数据库连接信息放在服务器环境变量，不得提交 GitHub。
4. 当前匿名申请无法验证申请人邮箱，项目适合受控的预约申请场景；部署者需制定隐私告知、垃圾申请防护和数据保留期限。
5. 管理员登录凭据不要通过聊天、代码或 GitHub issue 发送。

## 开源

- 许可证：MIT（仅针对本仓库全新原创代码及明确授权素材）
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 安全说明：[SECURITY.md](SECURITY.md)
- 路线图见英文 README 的 Roadmap。

**申请 Codex for Open Source 时应如实说明项目当前的使用、维护及贡献情况。公开新仓库不等于自动满足官方活动条件。**

## v0.2.1 安全增强

- 后台新增和修改操作增加同源请求校验；服务器配置的 `APP_URL` 必须与实际浏览器访问的协议、域名和端口一致。
- API 请求体有读取大小上限，降低异常巨大请求的资源消耗风险（仍需代理层限流）。
- 预约查询链接改为 `/track#token=...`，令牌位于 URL 片段，前端通过 POST 请求查询，避免令牌直接进入常规服务器 URL 日志。
- 预约日期和时段使用部署者设置的 `APP_TIME_ZONE`，不再依赖访客电脑本地日期计算。
- 新增 `npm run test:static`，无需安装依赖即可运行基础安全与时区测试。

## 发布到 GitHub（建议先私有）

可以在 Mac 安装 GitHub CLI `gh` 并运行 `gh auth login`，然后在项目目录执行 `bash scripts/create-private-github-repo.sh`。脚本会检查 GitHub 登录账号，经过两次确认才创建全新的 **Private** 仓库 `gbhysss/open-venue-booking`，不会修改原来的 `yycg`。

完成真实构建、数据库集成测试、演示环境验证、敏感数据排查与代码授权核对后，再考虑公开发布。

## v0.2.1

修复内容与升级步骤：[docs/upgrading-0.2.1.md](docs/upgrading-0.2.1.md)。验证范围：[QUALITY_STATUS.md](QUALITY_STATUS.md)。

## v0.2.2 容器验证

容器健康检查、数据库恢复验收与本机演示步骤见 [docs/container-verification.md](docs/container-verification.md)。GitHub Actions 的 Docker 任务提供逐次提交的验收结果。
