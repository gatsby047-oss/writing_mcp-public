# AI Persona Writing Studio

[中文](./README.md) | [English](./README.en.md)

> 一个中文优先的 AI 写作 MVP。  
> 它不追求功能堆叠，而是验证一个更具体的产品判断：AI 写作工具不该每次都像第一次认识作者，而应该在“生成 -> 采纳 -> 学习 -> 再生成”的闭环里，逐步贴近作者的长期风格与偏好。

![Workbench overview](./docs/overview.png)

_当前公开版工作台将原先单页堆叠的操作拆成 `总览 / 写作 / 大纲 / 上下文 / 质检` 五个工作区，用更清晰的层级承载写作闭环。_

## 项目快照

| 维度 | 内容 |
| --- | --- |
| 项目类型 | 面向长期风格沉淀的 AI 写作 MVP |
| 核心命题 | 被用户采纳的输出，应该反过来参与后续生成 |
| 关键路径 | 大纲澄清 -> 生成 -> 采纳 -> 学习 -> 再生成 |
| 当前体验 | 五分区工作台、本地优先、中文界面可切英文、`mock` 模式可稳定演示 |

## 项目理念

这是一个帮助用户树立个人 IP 的自学习写作工具的初步探索项目，基于多轮实际试做与迭代。

当前版本围绕的不是“再包一层模型调用”，而是几个更贴近真实产品的问题：

- 作者是否会愿意使用一个能逐步记住自己风格的写作工具
- 被作者采纳的结果，是否应该成为后续生成的长期信号
- 在不引入重基础设施的前提下，能不能先做出一个完整、可讲清楚的个性化闭环

长期方向不是只生成文本，而是持续积累偏好记忆，帮助用户沉淀稳定风格、逐步树立个人 IP，并演化成更懂用户的创作伙伴。

## 可见亮点

- 用户画像、项目风格覆盖和采纳后学习共同构成个性化闭环
- 工作台重构为五分区流转，降低单页堆叠带来的认知负担
- 本地 JSON 存储与 `mock` 模式保证低启动成本和稳定演示
- 代码范围收敛，但同时覆盖前端体验、服务端逻辑与持久化链路
- 当前版本已经留出向 MCP 工具层继续演化的清晰边界

## 仓库包含内容

该仓库提供项目的公有 Web 版本，便于公开展示、合作讨论与快速演示。

- 主体产品位于 `ui/`，基于 Next.js App Router
- 应用包含 `Bookshelf`、`Workbench`、`Profile`、`Settings`
- 首页说明默认中文，应用内支持中英切换
- 工作台已经重构为更产品化的五分区流转：`总览 / 写作 / 大纲 / 上下文 / 质检`
- 使用 Next.js API routes + 本地 JSON 存储，方便本地跑通和解释
- 提供 `mock` 模式，没有真实模型密钥时也能稳定演示

## 核心闭环

1. 用户创建项目并进入章节写作
2. 系统先做大纲澄清，而不是盲目直接生成
3. AI 生成正文、续写、润色、总结或诊断结果
4. 用户采纳结果后，系统从前后文本差异中提取偏好信号
5. 用户画像被更新，并在后续提示词中继续生效

这一闭环构成了当前版本的产品核心，也解释了整体范围为何保持紧凑。

## 相关文档入口

1. [README.md](./README.md)  
   产品主张、MVP 范围与仓库定位。
2. [ARCHITECTURE.md](./ARCHITECTURE.md)  
   学习闭环、存储策略、为何不用训练管线，以及后续如何演化。
3. [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)  
   5 到 8 分钟的演示路径与展示重点。

## 范围边界

### 当前版本包含

- 个性化画像
- 采纳后学习
- 多轮大纲澄清
- 项目级风格覆盖
- 本地 QC 与禁用表达
- 中文优先但可切英文
- 可稳定展示的 `mock` 模式

### 当前版本暂不包含

- 账号体系
- 云端数据库
- 多人协作
- 复杂内容管理后台
- 真正的模型训练管线
- 过大的平台化设计

当前阶段优先验证核心产品闭环，因此账号、数据库和更重的平台化基础设施被有意延后。

## MCP 状态

现在它是一个 Web App，不是独立的 MCP Server。

但它已经具备向 MCP 演化的合理结构基础：

- 服务端逻辑已经拆成可复用的本地服务层
- 目前 API 已经覆盖 `generate / analyze / outline / profile / learn`
- 更合理的下一步不是重写一套逻辑，而是在现有服务层之上暴露 MCP 工具

后续演化方向可包括：

- `generate`
- `generate-outline`
- `get-profile`
- `learn-profile`

## 核心能力

- 持久化用户画像，并可控制是否注入到生成链路
- 根据“采纳后的结果”自动学习，也支持手动学习输入
- 中文优先界面，并支持切换英文 UI
- 项目级风格覆盖：题材、基调、读者、约束
- 多轮大纲澄清，再进入章节生成
- 本地 QC 检查与禁用表达约束
- `mock` 与 `openai-compatible` 双模式运行

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Zustand
- Tailwind CSS
- Vitest

## 本地启动

在仓库根目录执行：

```bash
npm run setup
npm run dev
```

然后打开 [http://localhost:3000](http://localhost:3000)。

## 构建与测试

生产检查：

```bash
npm run build
npm run start
```

测试：

```bash
npm run test:run
```

## 环境变量

真实模型调用是可选的。没有 `ui/.env` 时，应用会自动运行在 `mock` 模式。

如果要接入 OpenAI-compatible 接口：

1. 复制 `ui/.env.example` 为 `ui/.env`
2. 填入你自己的凭据

示例默认使用 DashScope 风格端点，但整体实现面向更通用的 OpenAI-compatible chat completions 接口。

## 项目结构

```text
.
|- ui/
|  |- src/app/               # App Router 页面与 API routes
|  |- src/components/        # 产品 UI
|  |- src/lib/               # 类型、状态、QC、客户端请求
|  \- src/lib/server/        # AI 运行时、画像服务、本地存储
|- DEMO_SCRIPT.md            # 5-8 分钟演示脚本
|- INSTALL.md                # 安装说明
\- ARCHITECTURE.md           # 设计说明与演化方向
```

## API 面

当前 Web 应用暴露了一组小而完整的本地 API：

- `GET/POST /api/settings/model`
- `GET/POST /api/profile`
- `POST /api/profile/learn`
- `GET /api/profile/learning-history`
- `POST /api/profile/undo`
- `POST /api/ai/generate`
- `POST /api/ai/analyze`
- `POST /api/ai/outline`

## 更多说明

- [INSTALL.md](./INSTALL.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

MIT，详见 [LICENSE](./LICENSE)。
