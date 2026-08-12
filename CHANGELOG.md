# Changelog

本文件记录已经交付的项目能力和版本变化。格式参考 Keep a Changelog，版本发布前的变化记录在 `Unreleased`。

## Unreleased

### Added

- 建立全项目索引，统一导航项目身份、三端开发目标、计划、系统状态、权威来源和派生项目入口。
- 建立全栈计划生命周期和永久保护规则，禁止 AI 删除、移动、重命名或替换既有计划文档。
- 建立派生项目记录母版基线、派生类型和业务范围的治理入口。
- 建立 `docs/PROJECT_REQUIREMENTS.md` 产品需求基线，集中定义母版目标用户、适用场景、目标能力、非目标、派生规则和完成验收标准。
- 建立 `BASE-*` 需求编号与全栈计划关联规则，区分目标能力、当前实现状态、实施过程和已交付事实。
- 建立讨论结论知识沉淀规则，将已确认或有证据的长期结论路由到现有权威文档，不保存聊天原文，也不提前创建空的 Brainstorming 或 Research 目录。
- 纳入 Backend、Admin、Web、共享包、Compose、GitHub Actions、ADR、架构、蓝图和运维文档的完整工程骨架。
- 建立 GitHub Actions 骨架就绪门禁；源码、测试、锁文件或 Dockerfile 未齐备时明确跳过对应 CI/CD 步骤。

### Fixed

- 修复根 `.env.example` 的乱码、粘连和职责错位，只保留 `compose.prod.yml` 使用的公开部署变量模板。
- 修复 Compose、GitHub Actions 和共享包说明中的既有乱码与换行损坏，并统一文本文件为 UTF-8 无 BOM且保留末尾换行。
