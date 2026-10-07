# TDK CLI — 在你的笔记本上启动服务

[English](README.md) | 简体中文 | [繁體中文](README-zh_tw.md) | [日本語](README-ja.md) | [한국어](README-ko.md)

TDK CLI 在你的笔记本上启动服务。它不是部署工具，也不是 Compose 文件：在 `service.json` 中定义每个服务，然后运行 `tdk up`。机器上不需要 Kubernetes。

稳定性：1.x 本地开发。生成的文件是一份契约；使用 `tdk config verify` 验证。核心 CLI 采用 MIT 许可，无需密钥。Premium 为可选项。

Docker 运行容器。Tilt 监视服务，并在你编码时实时更新容器。TDK CLI 编写 Tilt 使用的配置。生产部署仍交给 Helm、Argo CD 或 Kustomize。

[官网](https://tdk-landscape.github.io/tdk-website/) · [快速开始](https://tdk-landscape.github.io/tdk-website/docs/quickstart/) · [示例](https://tdk-landscape.github.io/tdk-website/docs/examples/) · [Awesome TDK](https://github.com/tdk-landscape/awesome-tdk-framework) · [演示](https://tdk-landscape.github.io/tdk-demo-animation/) · [报告问题](https://github.com/tdk-landscape/tdk-cli-core/issues)

## 谁在使用 TDK

目前还没有团队列入。成为第一个吧：[告诉我们你在使用 TDK](https://github.com/tdk-landscape/tdk-cli-core/issues/new?template=we-use-tdk.yml)，或在 [ADOPTERS.md](ADOPTERS.md) 中添加一行。

## 快速开始

```bash
mkdir shop && cd shop
tdk project --yes
tdk resource orders-api --type backend --stack shop --yes
tdk up shop
curl http://api.shop.localhost:8080/api/orders/health
```

![TDK 搭建后端和前端，然后列出 stack](docs/assets/demo.svg)

*搭建后端和前端，然后列出整个 stack。*

![使用 TDK CLI 的 9 个场景：搭建服务、启动 stack、热重载、端口管理、自动发现、启动顺序、代理路由、包含基础设施、配置验证](docs/assets/tdk-cli-top-9-uses.jpg)

如果 Helm、Compose 或你现有的 Tilt 配置已经提供了可用的本地环境，请继续使用。TDK CLI 面向需要管理多个服务、希望获得清晰的本地服务契约并用一条命令启动整个 stack 的工程师。

参见[TDK CLI 如何与 Helm 配合](https://tdk-landscape.github.io/tdk-website/docs/with-helm/)、[服务 schema](engine/schemas/service-schema.json) 和[项目配置 schema](engine/schemas/project-schema.json)。

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![CI](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/ci.yml)
[![Quickstart E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/quickstart-e2e.yml)
[![ERP fixture scale E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml/badge.svg)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/erp-scale-e2e.yml)
[![Example apps E2E](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml/badge.svg?branch=main)](https://github.com/tdk-landscape/tdk-cli-core/actions/workflows/examples-e2e.yml)
[![Known Vulnerabilities](https://snyk.io/test/github/tdk-landscape/tdk-cli-core/badge.svg)](https://snyk.io/test/github/tdk-landscape/tdk-cli-core)
[![Socket Badge](https://badge.socket.dev/npm/package/@tdk-landscape/tdk-cli-core/latest)](https://socket.dev/npm/package/@tdk-landscape/tdk-cli-core/overview)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 安装

从 npm 安装 CLI（需要 Node.js 22.12+），或使用预构建二进制文件（无需 Node.js 或 Bun）：

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or install the prebuilt binary
curl -fsSL https://tdk-landscape.github.io/install.sh | sh
```

`tdk up shop --dry-run` 会在启动容器之前预览所选的本地服务和 URL。默认模板是 Bun/TypeScript；TDK 的核心职责是通过 Docker + Tilt 运行本地容器，而不是提供 Node.js 应用框架。参见[单后端示例](examples/one-backend/README.md)。

## 何时不要使用 TDK

- 你现有的 Compose 或 Tilt 工作流已经提供了可用的本地环境。
- Helm 就是你全部的开发工作流，并且你不想在 Docker 上运行本地服务。
- 你不想使用 `service.json` 清单和生成的本地配置。

## 文档

- [文档索引](docs/README.md)
- [与 Helm 协同使用](docs/with-helm.md)
- [配置与编辑器 schema](docs/configuration.md)
- [可运行的单后端示例](examples/one-backend/README.md)
- [可运行的 Python 后端示例](examples/one-backend-python/README.md)
- [完整的多服务示例](examples/tdk-example/README.md)
- [功能与许可限制](docs/FEATURES.md)
- [坦率的对比与已知限制](docs/compare-honest.md)
- [公开声明登记表](docs/claims.md)
- [Show HN 草稿](docs/drafts/show-hn.md)
- [架构与仓库地图](docs/project-overview.md)
- [规模测试夹具的测量结果与注意事项](docs/benchmarks/scale-bench.md)

## 历史

TDK 比本仓库及其 npm 包所显示的更早。开发始于 2026 年 4 月 21 日，位于 [tdk-landscape/tdk](https://github.com/tdk-landscape/tdk)，该仓库现已归档并作为只读历史保留；其首次提交为 [`1714637`](https://github.com/tdk-landscape/tdk/commit/1714637637196ed54cbfa18534230a782c05ab36)（"Initial commit: TDK specs, generators, CLI, and standards"）。本仓库 `tdk-cli-core` 创建于 2026 年 9 月 19 日，开发在此继续；npm 上的 `@tdk-landscape/tdk-cli-core` 包于 2026 年 9 月 21 日首次发布。因此，代码谱系比你在 GitHub 和 npm 上看到的仓库与包日期早约五个月。

## 环境要求与支持

本地运行需要安装 Docker（Desktop、OrbStack 或 Colima；Engine 25+、Compose 2.20.2+）和 [Tilt](https://docs.tilt.dev/install.html)。默认生成的服务使用 Bun 1.2+。TDK 会从有界的回退范围中为 HTTP、HTTPS 和 Postgres 选择主机端口；可设置 `TDK_HTTP_PORT`、`TDK_HTTPS_PORT` 或 `TDK_POSTGRES_PORT` 来覆盖。TDK 支持 macOS、Linux，以及通过 WSL2 Ubuntu 的 Windows；原生 Windows 仅支持 CLI 检查。运行 `tdk doctor` 检查本地就绪情况。参见 [WSL2 设置](docs/wsl2.md)。

在原生 Windows 上，`tdk --version`、`tdk doctor` 和 `tdk up --dry-run` 是仅检查命令。`tdk up` 会以退出码 2 退出，并提示 “Landscape startup needs Ubuntu on WSL2. Native Windows is inspect-only.”

## 许可矩阵

| 能力 | 免费 | Premium |
| --- | --- | --- |
| `tdk up`、脚手架、Traefik、Postgres、Tilt 实时更新、golden layers | 是 | 是 |
| Verdaccio、DDD 脚手架、Sablier 空闲停止 | 否 | 需要密钥 |
| Playwright、C4、AGENTS.md | 在仓库内生成则免费 | 仅当使用密钥下载实现时 |

核心永久免费。Premium 是针对上述附加功能的独立密钥；运行 `tdk up` 无需密钥。

**生态地图：** 示例、文章、相关工具和笔记位于 [awesome-tdk-framework](https://github.com/tdk-landscape/awesome-tdk-framework)。如果你运行的是这个 CLI，请给本仓库（`tdk-cli-core`）点个 Star；其余内容请通过 awesome 列表浏览。

## 贡献与许可

欢迎贡献。请从 [CONTRIBUTING.md](CONTRIBUTING.md) 和[贡献者指南](docs/contributing/README.md)开始。请按照 [SECURITY.md](SECURITY.md) 报告安全问题。

TDK 采用 MIT 许可；参见 [LICENSE](LICENSE)。
