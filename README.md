# AI Persona Writing Studio

[中文](./README.md) | [English](./README.en.md)

> 一个中文优先、面向面试展示的 AI 写作 MVP。  
> 它不追求功能堆叠，而是验证一个更具体的产品判断：AI 写作工具不该每次都像第一次认识作者，而应该在“生成 -> 采纳 -> 学习 -> 再生成”的闭环里，逐步贴近作者的长期风格与偏好。

![Workbench overview](./docs/overview.png)

## 面试官 30 秒速览

| 维度 | 说明 |
| --- | --- |
| 解决的问题 | 通用 AI 写作工具会生成内容，但通常不会真正“记住作者” |
| 产品判断 | 比起继续堆功能，更值得先验证“采纳后的输出能否反过来改进下一次生成” |
| MVP 范围 | 写作 -> 大纲澄清 -> 生成 -> 采纳 -> 学习 -> 再生成 |
| 当前形态 | 一个可本地运行、可稳定演示、中文优先且可切英文的 Web App |

## 项目理念

这是一个迈向“自学习进化的个人 IP 写作工具”的初步探索项目，来自个人尝试与多次迭代。

我想验证的不是“再包一层模型调用”，而是更贴近真实产品的问题：

- 作者是否会愿意使用一个能逐步记住自己风格的写作工具
- 被作者采纳的结果，是否应该成为后续生成的长期信号
- 在不引入重基础设施的前提下，能不能先做出一个完整、可讲清楚的个性化闭环

长期目标不是只生成文本，而是持续积累偏好记忆、强化风格身份，并逐步演化成更懂用户的创作伙伴。

## 为什么这个仓库适合拿来面试交流

- 它展示的是产品判断，而不是单纯的功能堆叠
- 它的范围被刻意收窄，所以可以在几分钟内讲清楚完整闭环
- 它同时包含前端体验、服务端逻辑和本地持久化，不只是一个静态页面原型
- 它保留了明确的演化方向，但没有假装“第一版已经解决一切”
- 它适合讨论取舍：为什么先不做账号、数据库、协作系统、复杂 CMS、训练管线

## 这个公开版具体包含什么

这是项目的公有 Web 版仓库，面向面试官、合作方和快速演示场景整理。

- 主体产品位于 `ui/`，基于 Next.js App Router
- 应用包含 `Bookshelf`、`Workbench`、`Profile`、`Settings`
- 首页说明默认中文，应用内支持中英切换
- 工作台已经重构为更产品化的五分区流转：`总览 / 写作 / 大纲 / 上下文 / 质检`
- 使用 Next.js API routes + 本地 JSON 存储，方便本地跑通和解释
- 提供 `mock` 模式，没有真实模型密钥时也能稳定演示

## 当前 MVP 的核心闭环

1. 用户创建项目并进入章节写作
2. 系统先做大纲澄清，而不是盲目直接生成
3. AI 生成正文、续写、润色、总结或诊断结果
4. 用户采纳结果后，系统从前后文本差异中提取偏好信号
5. 用户画像被更新，并在后续提示词中继续生效

这个闭环是整个仓库最重要的部分，也是我刻意围绕它控制范围的原因。

## 面试时建议先看这三处

1. [README.md](./README.md)  
   先看产品主张、MVP 范围和仓库定位。
2. [ARCHITECTURE.md](./ARCHITECTURE.md)  
   再看学习闭环、存储策略、为何不用训练管线，以及后续如何演化。
3. [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)  
   最后看一遍 5 到 8 分钟的演示路径，基本就能顺着完整讲下来。

## 这版产品我刻意做了哪些取舍

### 刻意保留

- 个性化画像
- 采纳后学习
- 多轮大纲澄清
- 项目级风格覆盖
- 本地 QC 与禁用表达
- 中文优先但可切英文
- 可稳定展示的 `mock` 模式

### 刻意不做

- 账号体系
- 云端数据库
- 多人协作
- 复杂内容管理后台
- 真正的模型训练管线
- 过大的平台化设计

原因很简单：这不是一版平台产品，而是一版要把核心判断跑通并讲清楚的最小作品。

## 当前是不是 MCP

现在它是一个 Web App，不是独立的 MCP Server。

但它已经具备向 MCP 演化的合理结构基础：

- 服务端逻辑已经拆成可复用的本地服务层
- 目前 API 已经覆盖 `generate / analyze / outline / profile / learn`
- 更合理的下一步不是重写一套逻辑，而是在现有服务层之上暴露 MCP 工具

如果后续继续做，我会优先考虑暴露这些能力：

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
