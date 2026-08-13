# 模块与依赖边界

## 1. 目标

本文件定义 Backend 领域、Web Feature、Admin Feature 和共享包之间的依赖方向。详细技术取舍见 [ADR 0006](../adr/0006-模块化单体与领域依赖边界决策.md)。

## 2. Backend 分层

```text
Router
-> Application Service
-> Domain Rule / Repository Port
-> Repository Adapter
-> Database Model
```

| 层 | 允许职责 | 禁止职责 |
| --- | --- | --- |
| Router | 协议参数、依赖声明、响应模型 | SQL、事务、业务编排、资源授权决策 |
| Application Service | 用例编排、事务、资源授权、领域协作 | HTTP 响应、直接依赖其他领域内部实现 |
| Domain | 业务规则、状态和不变量 | 框架、HTTP、数据库适配细节 |
| Repository Port | 领域所需的持久化能力接口 | SQLAlchemy 实现和事务提交 |
| Repository Adapter | 查询、写入、加载策略和 `flush` | 业务规则、权限、`commit`、吞错 |
| Model | 本领域数据库结构和关系 | API 输入输出契约 |
| Schema/DTO | 边界输入输出和公开数据结构 | ORM 行为和隐式数据库访问 |

事务由 Application Service 控制。Repository 可以 `add`、`delete`、查询和 `flush`，不得自行 `commit` 或回滚后继续返回成功。

## 3. 领域所有权

每个领域拥有：

- 自己的写模型和数据表。
- 自己的 Repository 和内部 Service。
- 自己的公开 Application Service、Port、DTO 或领域事件。
- 自己的业务规则和对应测试。

其他领域不得导入其 `repository`、`models`、内部 `service` 或未公开模块。跨领域写流程进入 `app/services/`，通过公开 Port 调用各领域，并由编排层确定事务和失败策略。

数据库外键不等于代码写权限。一个领域可以保存另一个领域公开标识，但不能直接更新对方表。跨领域级联删除默认禁止，生命周期联动必须显式编排。

## 4. 查询边界

普通写模型不得为了方便直接 JOIN 其他领域内部表并据此修改状态。

以下只读场景可以使用独立 Query Service 或 Read Model：

- 管理报表。
- 搜索索引。
- 列表聚合和导出。
- 不参与业务决策的展示视图。

只读模型必须标明来源、刷新方式、一致性预期和权限过滤。不得把只读聚合对象传回领域写流程充当权威状态。

## 5. 前端 Feature 边界

Web 和 Admin 是独立应用，彼此不得引用源码。每个 Feature 只能通过自己的公开入口向外暴露稳定能力。

```text
Route / Page
-> Feature Public API
-> Feature UI / Hook / Query
-> Shared API Client
```

约束如下：

- 页面负责路由和页面级编排，不直接拼接底层请求。
- Feature A 不得导入 Feature B 的内部组件、Hook、Store 或请求实现。
- 跨 Feature 复用首先判断是否属于公共 UI、公共基础设施或后端契约。
- 服务端数据由 Server Components 或 TanStack Query 管理，不复制到 Zustand。
- Zustand 只保存非敏感客户端状态，认证 Token 不进入客户端可读持久化存储。
- `packages/` 只接受业务中立、边界明确且确有跨应用复用的能力。

## 6. 共享包准入

新增共享包必须同时满足：

1. 至少两个应用存在已确认的复用需求，或它是全仓库生成契约和工具配置的唯一来源。
2. 职责单一且业务中立。
3. 具有公开导出入口，消费者不访问内部文件。
4. 不依赖 `apps/` 中的任何源码。
5. 在计划中列出所有消费者、版本影响和验证命令。

涉及长期依赖方向或发布方式变化时新增 ADR。轻量、明确的共享配置扩展可以在已确认计划中完成，不要求为每次小改动单独创建 ADR。

## 7. 自动门禁

阶段 A 使用 `scripts/ci/check-module-boundaries.ps1` 检查可以从静态路径和导入语句确定的违规：

- 应用之间的直接源码引用。
- Frontend Feature 之间的内部路径引用。
- Backend 领域之间对 Repository、Model 和内部 Service 的直接引用。
- `packages/` 反向依赖 `apps/`。

后续代码结构进入 `ready` 后，工程基础设施计划必须补充 Python 架构测试和 TypeScript 依赖图检查，验证动态导入、路径别名、循环依赖和公开入口。脚本无法证明的语义边界继续由测试和评审承担，不能把简单文本扫描表述成完整架构验证。
