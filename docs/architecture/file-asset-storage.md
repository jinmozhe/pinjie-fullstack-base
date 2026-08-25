# 文件与多媒体资产存储架构

## 1. 适用范围

本文说明母版统一文件资产能力的领域边界、存储流程、安全策略和一致性语义。当前实现提供本地磁盘驱动；云对象存储由派生项目在保持同一 `StorageProvider` 契约的前提下扩展。

## 2. 组件与职责

| 组件 | 职责 |
| --- | --- |
| `app/domains/assets/` | 声明上传、分页查询、删除的 HTTP 契约与资产 Schema |
| `app/services/assets.py` | 执行场景策略、主体授权、去重、元数据事务和删除补偿 |
| `app/services/storage/` | 定义存储端口并实现本地文件的暂存、提交、恢复和清理 |
| `app/db/models/asset.py` | 保存资产主体、存储键、真实 MIME、大小、哈希、URL 与场景 |
| Admin/Web 上传组件 | 选择文件、调用双域上传端点、回填站内资源路径并展示结果 |

Router 不处理文件系统或数据库事务。Repository 只读写资产元数据，文件副作用由 Service 通过存储端口编排。

## 3. 上传流程

1. `/api/v1/assets/upload` 根据精确 `Origin` 选择 Web 或 Admin Cookie Profile。
2. 依赖层验证访问 Cookie、权威会话、CSRF Cookie/Header 配对和 Session 中的 CSRF 摘要。
3. Service 校验受控 `scene`、扩展名、场景体积上限和上传主体可用场景。
4. 本地驱动以 64 KiB 分块在线程池读取，计算 SHA-256，并通过 Magic Number 与 OOXML ZIP 结构探测真实类型。
5. 文件先写入私有 staging，完成 `fsync` 后以 `os.replace` 原子提交到公开根目录。
6. 元数据写入 PostgreSQL；提交失败时对已经落盘的文件执行补偿删除。
7. 返回 `/static/uploads/{scene}/{YYYYMMDD}/{hash}_{uuid}.{ext}` 站内路径。

同一上传主体、场景和 SHA-256 哈希命中唯一约束时复用已有资产。去重不跨主体，避免共享物理对象导致授权和删除引用不明确。

## 4. 本地目录与持久卷

本地开发默认公开根为 `apps/backend/uploads`。生产容器使用以下布局：

```text
/app/storage/
├── uploads/
│   └── {scene}/{YYYYMMDD}/{hash}_{uuid}.{ext}
├── .uploads-staging/
└── .uploads-trash/
```

生产命名卷挂载 `/app/storage`，`UPLOAD_LOCAL_ROOT` 为 `/app/storage/uploads`。staging、trash 和公开文件因此位于同一文件系统，原子移动不会跨卷；FastAPI 只挂载 `uploads/`，两个私有目录不进入静态路由。

## 5. 场景与安全边界

- `avatar`：JPEG、PNG、WebP，最多 2 MB。
- `article`：JPEG、PNG、WebP、GIF，最多 5 MB。
- `product`：JPEG、PNG、WebP，最多 10 MB。
- `document`：PDF、DOC、DOCX、XLS、XLSX，最多 30 MB。
- `attachment` 与 `temp`：受全局扩展名和总大小上限控制。
- Web 用户只允许 `avatar`、`attachment` 和 `temp`；Admin 可以使用全部场景。
- SVG 始终不在默认白名单中，避免同源静态脚本执行风险。
- 客户端声明的 `Content-Type` 不作为信任来源，响应带 `X-Content-Type-Options: nosniff`。
- 文件名只保存为元数据；落盘键由场景、日期、哈希和 UUID 生成，禁止使用原始路径。

## 6. 删除一致性

管理员删除资产必须具有 `assets:delete` 权限、通过二次确认并写审计事件。Service 先把公开文件原子移动到私有 trash，再在审计事务中删除元数据：

- 数据库事务成功后清理 trash。
- 数据库事务失败时把文件恢复到原路径并传播失败。
- 恢复失败时返回需要人工核查的存储错误并记录 Critical 日志，禁止返回假成功。
- trash 最终清理失败不翻转已经提交的数据库结果，但必须记录 Critical 日志并由运维核查残留。

## 7. 扩展边界

新增 S3、OSS、COS 或 MinIO 驱动时必须实现同等的暂存/确认、存在检查、删除恢复或等价补偿语义，并通过专项计划说明幂等、结果未知、公开 URL、权限、加密、保留期和故障恢复。禁止在配置中声明未实现驱动后静默回退本地磁盘。
