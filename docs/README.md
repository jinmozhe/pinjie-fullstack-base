# docs/ 文档索引

> **维护规则**：每次在 `docs/` 目录下新建或修改文档，必须同步更新本文件中对应的记录。
> 索引只写"路径 + 一句话说明"，不写长正文。

---

## 产品需求基线

| 文件 | 说明 |
| --- | --- |
| [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md) | 母版目标用户、适用场景、目标能力、非目标、派生规则和完成验收标准 |

---

## adr/ - 架构决策记录

> 记录重大技术选型和架构决策。只追加，不修改。如果推翻旧决策，新建一条 ADR 说明。

| 文件 | 说明 |
| --- | --- |
| [0001-全栈Monorepo架构决策.md](adr/0001-全栈Monorepo架构决策.md) | 为什么选择 pnpm workspace Monorepo、通用母版边界、共享规则 |
| [0002-Codex与Antigravity指令兼容决策.md](adr/0002-Codex与Antigravity指令兼容决策.md) | 统一 AGENTS.md 规则正文，并通过 Antigravity Workspace Rules 桥接加载 |
| [0003-本地开发环境架构决策.md](adr/0003-本地开发环境架构决策.md) | 选择纯 uv、pnpm、本机 PostgreSQL 与 Docker Desktop Redis 的本地开发组合 |
| [0004-全项目索引与计划生命周期决策.md](adr/0004-全项目索引与计划生命周期决策.md) | 建立全项目索引、全栈计划生命周期、永久计划登记和派生项目继承规则 |

---

## architecture/ - 架构设计说明

> 描述仓库和应用的结构设计，面向开发者，说明"是什么、为什么这样设计"。

| 文件 | 说明 |
| --- | --- |
| [project-structure.md](architecture/project-structure.md) | 完整目录树 + 工程文件设计说明（全项目索引、全栈计划、AI 规则桥接、环境变量和锁文件等） |
| [全栈Monorepo架构规划原始方案.md](architecture/全栈Monorepo架构规划原始方案.md) | 从 pinjie-standard 迁移的完整原始规划方案，包含技术选型对比、电商领域设计、1Panel 部署规范 |

---

## blueprints/ - 业务扩展蓝图

> 母版只含通用能力（auth/users/admin/system）。业务领域扩展的设计思路、数据模型、实施步骤记录在这里，供派生仓库参考。

| 文件 | 说明 |
| --- | --- |
| [blueprints/commerce/README.md](blueprints/commerce/README.md) | 电商业务蓝图：领域划分（商品/库存/购物车/订单/支付/促销/评价）与派生仓库建议 |

待补充目录（有需要时创建）：

- `blueprints/cms/` - 内容管理系统蓝图
- `blueprints/blog/` - 博客系统蓝图
- `blueprints/corporate-site/` - 企业官网蓝图

---

## operations/ - 运维操作手册

> 可执行的操作步骤文档，面向部署和日常运维，不讲理论只讲操作。

| 文件 | 说明 |
| --- | --- |
| [local-dev-environment.md](operations/local-dev-environment.md) | Windows 本地开发手册：纯 uv、pnpm、本机 PostgreSQL、Docker Desktop Redis 与生产环境边界 |
| [uv使用指南.md](operations/uv使用指南.md) | uv 原理、纯 uv 环境方案、常用命令和 conda 对比 |
| [pnpm使用指南.md](operations/pnpm使用指南.md) | pnpm 存储机制、workspace 共享包、常用命令和 npm 对比 |

待补充文档（有需要时创建）：

- `operations/1panel-production-runbook.md` - 1Panel 生产部署手册
- `operations/database-backup-restore.md` - 数据库备份与恢复

---

## 索引维护说明

新增文档时，在对应目录区块的表格中追加一行：

```text
| `文件名.md`（链接到对应相对路径） | 一句话说明文档用途 |
```

修改文档时，如果文档用途或范围发生变化，更新对应行的说明文字。

删除文档时，同步删除对应行，并在行末注明删除原因（可选）。
