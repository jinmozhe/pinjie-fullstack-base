# pinjie-fullstack-base 项目索引

本文件是项目身份、当前阶段、活动计划和权威入口。全部实施计划的永久登记见 [plans/INDEX.md](plans/INDEX.md)。

## 项目身份

| 字段 | 当前值 |
| --- | --- |
| 项目角色 | 通用全栈 Monorepo 母版 |
| 派生类型 | 无 |
| 母版基线 | 当前仓库 |
| 当前阶段 | v0.1.1 不可变发布、GitHub 固定 SHA 验证与交接、CNB 三镜像构建扫描、TCR 单仓不可变发布和跨 Commit Registry 缓存复用均已验证；本地生产编排已改为接入 1Panel 共享 PostgreSQL 与 Redis，生产迁移和部署未触发；旧版管理员确认端点限时保留至 2026-09-26 |
| 业务范围 | 认证、用户、管理、系统等跨业务通用能力；具体业务进入蓝图或派生仓库 |

## 权威入口

| 事项 | 唯一来源 | 用途 |
| --- | --- | --- |
| 全仓库长期规则 | [AGENTS.md](AGENTS.md) 与三个应用级 `AGENTS.md` | 任务读取、工程边界、验证和交付规则 |
| 项目身份与阶段导航 | [PROJECT_INDEX.md](PROJECT_INDEX.md) | 项目身份、当前阶段、活动计划和权威入口 |
| 详细实现状态 | 实际源码、配置、迁移、生成契约与对应架构文档 | 判断具体能力、接口和运行机制是否已经实现 |
| 产品需求基线 | [docs/PROJECT_REQUIREMENTS.md](docs/PROJECT_REQUIREMENTS.md) | 母版目标用户、能力、非目标和验收边界 |
| 计划规则 | [plans/README.md](plans/README.md) | 计划创建、格式、状态、完成和保护规则 |
| 计划永久登记 | [plans/INDEX.md](plans/INDEX.md) | 全部实施计划的路径、状态、结果、范围和用途 |
| 项目文档清单 | [docs/README.md](docs/README.md) | `docs/` 下全部项目文档导航 |
| 架构决策 | [docs/adr/](docs/adr/) | 长期技术取舍及其理由 |
| 架构机制 | [docs/architecture/](docs/architecture/) | 当前系统边界、认证、错误、测试和可靠性机制 |
| 开发与运维步骤 | [docs/operations/](docs/operations/) | 本地开发、发布、部署、恢复和故障处理 |
| 已交付变化 | [CHANGELOG.md](CHANGELOG.md) | 已交付能力和版本变化 |
| 安全治理 | [SECURITY.md](SECURITY.md) | 漏洞报告、安全响应和安全开发要求 |
| OpenAPI 契约 | [openapi.json](openapi.json) | 后端导出的唯一机器契约，禁止手工修改 |

## 活动计划

| 计划 | 状态 | 说明 |
| --- | --- | --- |
| 无 | 无 | 当前没有活动计划 |
