# Backend 项目规则

## 作用范围与技术栈

- 本文件适用于 `apps/backend/**`，并继承仓库根 `AGENTS.md`。
- 后端采用 Python 3.12、FastAPI、Pydantic v2、SQLAlchemy 2 async、Alembic、PostgreSQL、Redis 和 uv。
- 新增实现应遵守 `app/core`、`app/db`、`app/domains`、`app/services` 的规划边界；目录尚未落地时，先按 `docs/architecture/project-structure.md` 创建最小必要结构。

## 分层边界

- Router 只负责协议层：参数接收、依赖注入、权限入口和响应模型声明，不承载业务编排或直接访问数据库。
- Service 承载业务规则、跨步骤编排和事务边界。跨领域流程放入 `app/services/`，单领域逻辑留在对应 `app/domains/<domain>/service.py`。
- Repository 只负责持久化查询和写入，不返回 HTTP 响应，不包含权限或业务决策。
- Model 表达数据库结构，Schema 表达输入输出契约，两者禁止混用。
- API 成功响应统一使用项目公共 `ResponseModel[T]`；业务错误统一抛出项目公共 `AppException`，禁止在各领域自创不兼容响应格式。

## 数据库与事务

- 使用 `AsyncSession` 和 SQLAlchemy 2.x 查询风格。异步上下文中显式使用 `selectinload`、`joinedload` 等加载关联，避免隐式懒加载和 N+1 查询。
- 事务由 Service 控制。Repository 可以执行查询、`add`、`delete` 和 `flush`，不得自行 `commit` 或吞掉异常。
- 表结构变更必须新增 Alembic 迁移并验证升级路径；禁止只改 Model 或直接手工改共享数据库。
- 业务主键默认使用 UUID v7，时间字段使用带时区时间，结构化扩展数据优先使用 PostgreSQL JSONB。引入 UUID v7 实现前先确认兼容 Python 3.12 的依赖或项目工具函数。
- 新建表和关键字段应提供清晰的中文数据库注释，命名保持 snake_case。

## 安全与外部系统

- 认证、授权、输入校验、速率限制和审计逻辑进入公共基础设施或对应领域，禁止散落在 Router。
- 密码只保存强哈希，令牌和密钥从环境变量读取，日志不得输出凭据、完整令牌或敏感个人信息。
- 外部 HTTP、支付、消息和第三方 API 调用必须设置超时、有限重试、幂等边界和失败关闭策略；重试不得放大有副作用的请求。
- 金额使用 `Decimal` 和明确币种，库存扣减、支付状态、佣金、钱包、提现等规则只在派生项目引入对应领域后生效，并需独立 ADR、约束和测试。

## 测试与命令

- 后端命令在 `apps/backend` 中执行：`uv sync`、`uv run ruff check .`、`uv run mypy app`、`uv run pytest`。
- 依赖使用 `uv add <package>` 或 `uv add --dev <package>`，提交 `pyproject.toml` 与生成后的 `uv.lock`。
- 数据库测试必须使用名称以 `_test` 结尾的独立数据库，并在测试启动时设置防误连保护。禁止让自动化测试连接开发库或生产库。
- 修改 Model 或迁移时验证 Alembic 升级；修改公开 Schema 或 Router 时重新导出根 `openapi.json`，再生成 API Client 并验证受影响前端。
- 当前代码骨架或脚本尚未具备某项检查条件时，明确报告缺失项，不临时伪造通过结果。
