# 升级到 v0.2.1

这是 OpenVenue 独立项目的修复预览版。升级前备份本项目的数据库和配置，在独立环境验证后再替换服务。

## 修复内容

- 暂停、启用或仅修改容量时，只更新明确提交的字段，不再清空简介/地点。
- 后台支持服务端状态筛选、分页、全部数据统计和页码边界处理。
- 审批时拒绝已经开始的预约、暂停场馆的预约和超过当前容量的预约；仍可驳回过期申请。
- PostgreSQL 行锁及原有排他约束保护并发审批和审计事件的一致性。
- Next.js 16.4.3、React / React DOM 19.2.9，附依赖锁文件，统一使用 npm ci。
- 配额检查与预约写入在同一事务内执行，并使用数据库时钟；默认每邮箱 24 小时最多 5 次、全站每分钟最多 60 次成功提交。
- 排除所有真实 .env 变体进入 Docker 构建上下文；运行文件由容器 node 用户持有。

此前被旧版覆盖的简介/地点不能凭空恢复，需要从本项目的备份或原始资料补录。已有预约和登录数据不需要重建。

## 本机开发环境

1. 将自己的配置保留在 `.env`，不要覆盖为示例密钥。
2. 安装依赖并应用新增索引：

```bash
npm ci
npm run db:migrate
npm run test:static
npm run typecheck
npm test
npm run build
```

`npm test` 中数据库回归需显式设置 `TEST_DATABASE_URL`，且数据库名必须以 `_test` 结尾。只使用可丢弃的独立测试库；没有设置时，相应测试会跳过。

`npm run test:api` 还需要一个已经启动、连接测试数据库的本机网站，以及 `TEST_APP_URL`、`TEST_DATABASE_URL`、`TEST_ADMIN_EMAIL`、`TEST_ADMIN_PASSWORD`。测试凭据只能对应虚构管理员。完整配置例子见 `.github/workflows/ci.yml`。

## 已有 Docker 部署

保留本项目现有 `.env` 与数据库卷。先备份数据库，再使用修复版源码重建、应用索引并重建应用：

```bash
docker compose --profile tools build
docker compose --profile tools run --rm maintenance npm run db:migrate
docker compose up -d app
```

这些 Docker 升级命令本次未在 Docker/Linux 环境实测。不要用 `docker compose down -v` 进行升级，也不要重新运行初始化管理员或演示数据脚本。

新增的 `0002_submission_indexes.sql` 仅添加两个幂等索引。当前迁移脚本按名称执行已提供的幂等 SQL 文件，可用于新安装和从 v0.2.0 升级；它不是通用的版本化迁移引擎。

## 配额与反向代理

`BOOKING_MAX_PER_MINUTE` 的默认值为 60，可设置为 1–10000 的整数；Docker Compose 会将它传入服务。该上限是整个部署共享的成功提交量，不是每个人的配额。大型组织可按实际使用调整。

共享上限和邮箱上限用于约束写入量，不能代替边缘代理对全部请求的限流、连接超时和机器人防护。项目不会信任任意客户端发送的转发 IP 头。匿名邮箱仍未进行所有权验证。

## API 兼容性

`GET /api/admin/reservations` 现在默认每页 25 条，可传 `status=all|pending|approved|rejected`、`page` 和 `pageSize`（最大 100），响应包含 `data`、`counts`、`pagination`。自定义客户端必须按 `pagination` 遍历，不能假定一次返回全部记录。

`PATCH /api/admin/venues/[id]` 拒绝空对象和未知字段；清空简介或地点时须明确提交空字符串。审批旧申请现在返回 HTTP 409，管理界面会显示原因。

具体本次验证与未完成范围见 `QUALITY_STATUS.md`。
