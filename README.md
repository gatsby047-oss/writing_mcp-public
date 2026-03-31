# AI 个性化写作工作台

[中文](./README.md) | [English](./README.en.md)

一个中文优先、面向面试展示的 AI 写作 MVP。

它聚焦一条很窄但完整的产品闭环：

1. 记住用户写作偏好
2. 在生成时注入用户画像
3. 从“采纳结果”里继续学习
4. 从大纲走到章节正文

这个项目的核心不是“再包一层模型调用”，而是验证一个更具体的判断：
AI 写作工具不该每次都像第一次见你，它应该逐步记住作者，并越来越像一个更贴近个人风格的创作搭档。

![Workbench overview](./docs/overview.png)

## 30 秒看懂

这是一个最小但完整的写作产品切片，用来探索一个核心想法：
“AI 写作工具应该记住作者、从采纳行为里学习，并逐步朝更个人化的创作伙伴演进。”

- 产品角度：重点不是一次性生成，而是个性化
- MVP 范围：写作 -> 生成 -> 采纳 -> 学习 -> 再生成
- 工程角度：本地优先、部署轻、行为可解释、演示路径稳定

## 项目理念

这是迈向“自学习进化的个人 IP 写作工具”的初步探索项目，来自个人尝试与多次迭代。

长期目标不只是生成文本，而是持续积累偏好记忆、强化风格身份，并逐步成长为更懂用户的创作工具。

## 这个仓库包含什么

这是项目的公开 Web 版仓库。

- 主体产品位于 `ui/`，基于 Next.js App Router
- UI 包含 `Bookshelf`、`Workbench`、`Profile`、`Settings`
- 仓库首页说明默认中文，但应用界面内置中英切换
- 服务端使用 Next.js API routes + 本地 JSON 存储
- 提供 `mock` 模式，方便没有真实模型密钥时稳定演示

## 给面试官看的重点

这个仓库刻意被收敛成一个 vibecoding 风格的最小 MVP：

- 一个明确问题：通用 AI 写作工具不会记住作者
- 一个可见主张：被采纳的输出应该改进后续生成
- 一个长期方向：演化为自学习的个人 IP 写作工具
- 一条完整演示链路：写作 -> 生成 -> 采纳 -> 学习 -> 再生成
- 极简基础设施：无登录、无数据库、无云端依赖也能演示主流程
- 稳定演示模式：`mock` 模式保证没有 API key 也可完整跑通

这里要展示的不是功能堆叠，而是产品判断、范围控制、快速迭代，以及一个真正跑通的个性化闭环。

## 如果只看三个地方

如果你只是快速扫一遍仓库，建议先看：

1. [README.md](./README.md)：产品主张、MVP 范围、演示定位
2. [ARCHITECTURE.md](./ARCHITECTURE.md)：学习闭环、存储策略、后续演化路径
3. [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)：最短演示路径

## 为什么说它是一个合格的最小 MVP

- 它解决的是一个真实交互问题，而不只是封装模型接口
- 它足够小，能在几分钟内讲清楚
- 它同时包含 UI 和服务端行为，因此更像一个真正交付过的产品切片
- 它足够轻，适合快速搭建；也足够有观点，适合认真讨论取舍
- 它给更长期的个人写作工具愿景留了空间，但不假装第一版已经完成全部目标

## 当前状态

这个仓库目前是一个 Web App，不是独立 MCP Server。

- 现在可以直接作为本地写作工作台运行
- 当前 API 结构已经为后续封装 MCP 留出了空间
- 更合理的后续方向是：在现有服务层之上暴露“画像感知生成”和“学习”工具，而不是重复实现两套逻辑

## 核心功能

- 持久化用户画像，可控制是否参与生成
- 接受 AI 结果后的自动学习，以及手动投喂学习
- 中文优先界面，并支持切换英文 UI
- 项目级风格覆盖：题材、基调、读者、约束
- 多轮大纲澄清，再进入章节生成
- 本地 QC 检查与禁用表达控制
- 双模式运行：`mock` 与 `openai-compatible`

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Zustand
- Tailwind CSS
- Vitest

## 本地开发

在仓库根目录执行：

```bash
npm run setup
npm run dev
```

然后打开 [http://localhost:3000](http://localhost:3000)。

## 生产检查

```bash
npm run build
npm run start
```

## 测试

在仓库根目录执行：

```bash
npm run test:run
```

或者进入 `ui/`：

```bash
npm test
npm run test:run
```

## 环境变量

真实模型调用是可选的。没有 `ui/.env` 时，应用会自动运行在 `mock` 模式。

如果要接入 OpenAI 兼容接口：

1. 复制 `ui/.env.example` 为 `ui/.env`
2. 填入你自己的凭据

示例默认使用 DashScope 风格端点，但整体代码路径面向的是更通用的 OpenAI-compatible chat completions 接口。

## 项目结构

```text
.
|- ui/
|  |- src/app/               # App Router 页面与 API routes
|  |- src/components/        # 产品 UI
|  |- src/lib/               # 类型、客户端请求、QC、状态管理
|  \- src/lib/server/        # AI 运行时、画像服务、本地存储
|- DEMO_SCRIPT.md            # 简短演示脚本
|- INSTALL.md                # 快速安装说明
\- ARCHITECTURE.md           # 设计说明与路线图
```

## API 面

Web 应用当前暴露了一组本地 API：

- `GET/POST /api/settings/model`
- `GET/POST /api/profile`
- `POST /api/profile/learn`
- `GET /api/profile/learning-history`
- `POST /api/profile/undo`
- `POST /api/ai/generate`
- `POST /api/ai/analyze`
- `POST /api/ai/outline`

## 设计说明

- 项目数据通过 Zustand 持久化在浏览器存储中
- 模型设置与已学习的用户画像保存在 `ui/.aiws-data` 本地 JSON 文件中
- 产品范围刻意收窄，方便把个性化闭环讲清楚
- 学习层采用启发式策略，而非训练流水线，以保证本地可运行、可解释、可演示
- 整体范围保持在 MVP 级别：一条强闭环、低搭建成本、清晰可演示

更多说明：

- [INSTALL.md](./INSTALL.md)
- [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)

## License

MIT，详见 [LICENSE](./LICENSE)。
