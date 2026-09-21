# 🚀 TDK CLI

> **T**ilt **D**evelopment **K**it - All-in-one local development platform for microservices

[![npm version](https://img.shields.io/npm/v/@tdk-landscape/tdk-cli-core.svg?style=flat&color=blue)](https://www.npmjs.com/package/@tdk-landscape/tdk-cli-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 What is TDK?

TDK CLI organizes your microservices using a clear **Project-Stack-Resource (PSR)** hierarchy:

```
📁 Project (1 per repo)
├── ⚙️  TILT_RESOURCE_DEFAULTS.star   # Ports, health checks, memory
├── 🔧 TILT_TECH_STACK.star          # Bun, Vite, Prisma, NATS
│
└── 📦 Stacks (deployment groups)
    ├── 🔐 api-stack
    │   ├── ⚡ api-backend      # Resource
    │   └── 🎨 web-frontend     # Resource
    │
    └── 📅 worker-stack
        ├── ⚡ worker-backend    # Resource
        └── 🎨 web-frontend     # Resource
```

---

## 📦 Installation

```bash
npm install -g @tdk-landscape/tdk-cli-core
# or
bun install -g @tdk-landscape/tdk-cli-core
```

---

## 🏗️ Project-Stack-Resource Commands

### 🌍 Project Level

Initialize your project with master configuration files:

```bash
# 🆕 Initialize project (creates master configs)
tdk project

# 📊 Check project info and config status
tdk projects              # Overview

tdk projects --check      # ✅ CI validation (exit 0/1)
```

**Creates:**
- ⚙️ `TILT_RESOURCE_DEFAULTS.star` — Platform config (ports 3000-4999, health checks, memory limits)
- 🔧 `TILT_TECH_STACK.star` — Tech stack lock (Bun v1.2, Vite v5, Prisma v7, NATS v2)

---

### 📦 Stack Level

Organize resources into deployment groups:

```bash
# 📋 List all stacks
tdk stacks
tdk stacks --services     # 🔍 Include resources in each stack

# 🗂️  Organize resources into stacks (interactive)
tdk stack api
tdk stack order

# ▶️ Start/stop a stack
tdk up api           # 🚀 Start api stack
tdk down                  # ⏹️  Stop all services
```

---

### ⚡ Resource Level

Create and manage individual services:

```bash
# 📋 List all resources
tdk resources
tdk resources --stack api     # 🔍 Filter by stack
tdk resources --no-stack           # ⚠️ Show unassigned only
tdk resources --ports              # 🔌 Show port assignments

# 🆕 Create new resource (interactive)
tdk resource my-api --type backend --stack api
tdk resource my-app --type frontend --stack api
tdk resource my-worker --type worker --stack background
```

**Creates:**
- 📄 `service.json` — Auto-assigned port from master config
- 📦 `package.json` — Scripts, dependencies (Hono/Vite/Biome)
- ⚙️ `tsconfig.json` — TypeScript configuration
- 🐳 `Dockerfile` — Multi-stage build with health checks
- 💻 `src/` — Starter code (Hono for backend, React for frontend)
- 🧪 `tests/` — Vitest test file

---

## 🔄 Lifecycle Commands

| Command | Description | Example |
|---------|-------------|---------|
| `tdk up` | 🚀 Start all services | `tdk up` |
| `tdk up <stack>` | 🚀 Start a stack | `tdk up api` |
| `tdk up <resource>` | 🚀 Start specific resource | `tdk up api-backend` |
| `tdk down` | ⏹️ Stop all services | `tdk down` |
| `tdk status` | 📊 Show resource status | `tdk status` |

---

## 🛠️ Utility Commands

| Command | Description |
|---------|-------------|
| `tdk ui` | 🎨 Interactive terminal UI |
| `tdk doctor` | 🔍 Check environment (Docker, Bun, Tilt, ports) |
| `tdk version` | ℹ️  Show version |
| `tdk --help` | ❓ Show help |

---

## 🚀 Quick Start Workflow

```bash
# 1️⃣  Initialize project
cd my-project
tdk project

# 2️⃣  Create resources
tdk resource api-api --type backend --stack api
# → Creates service.json with port 4000
# → Generates src/index.ts with Hono starter
# → Creates Dockerfile, tests/, package.json

tdk resource api-app --type frontend --stack api
# → Creates service.json with port 3000
# → Generates React starter with Vite

# 3️⃣  Install dependencies
cd api-api && bun install
cd ../api-app && bun install

# 4️⃣  Start development
tdk up api

# 5️⃣  Check status
tdk status
tdk resources --stack api
```

---

## 📊 PSR Command Matrix

| Level | 🔨 Create/Action | 📋 List |
|-------|------------------|---------|
| **🌍 Project** | `tdk project` | `tdk projects` |
| **📦 Stack** | `tdk stack` | `tdk stacks` |
| **⚡ Resource** | `tdk resource` | `tdk resources` |

---

## 🎨 Resource Types

| Type | Port Range | Template | Use Case |
|------|------------|----------|----------|
| `backend` | 4000-4999 | 🏎️ Hono API | REST APIs, microservices |
| `frontend` | 3000-3999 | ⚛️ React + Vite | Web apps, dashboards |
| `worker` | (optional) | 🔧 Background worker | Queue processors, jobs |

---

## 🔒 Deterministic Operations

Use `Determinism` in your Tiltfile for reproducible builds:

```starlark
load('ext://tdk-cli', 'Determinism')

# Deterministic file discovery (sorted results)
files = Determinism.deterministic_find('./services', 'service.json')

# Deterministic service discovery
services = Determinism.deterministic_resource_discovery(['services/product'])

# Check deterministic mode
if Determinism.is_deterministic_mode():
    print("✅ Running in deterministic mode")
```

---

## 🔍 Environment Validation

```bash
🔧 tdk doctor
```

Checks for:
- ✅ Docker daemon running
- ✅ Bun runtime installed (v1.2+)
- ✅ Tilt CLI available
- ✅ Required ports free
- ✅ Tiltfile present
- ✅ Master config files exist

---

## 📁 Project Structure

After `tdk project` + `tdk resource`:

```
my-project/
├── ⚙️ TILT_RESOURCE_DEFAULTS.star
├── 🔧 TILT_TECH_STACK.star
├── 📄 Tiltfile
│
├── services/
│   └── api/
│       ├── api-api/           # 🆕 Created by tdk resource
│       │   ├── service.json      # Port 4000, stack: api
│       │   ├── package.json
│       │   ├── tsconfig.json
│       │   ├── Dockerfile
│       │   ├── src/
│       │   │   └── index.ts      # Hono starter
│       │   └── tests/
│       │       └── api-api.test.ts
│       │
│       └── api-app/         # 🆕 Created by tdk resource
│           ├── service.json      # Port 3000, stack: api
│           ├── package.json
│           ├── tsconfig.json
│           ├── Dockerfile
│           ├── index.html
│           └── src/
│               ├── main.tsx
│               └── App.tsx
│
└── workers/
    └── notification-worker/      # 🆕 Created by tdk resource
        └── ...
```

---

## 🆘 Getting Help

```bash
# General help
tdk --help

# Command help
tdk resource --help
tdk stack --help
tdk up --help
```

---

## 📚 Documentation

- [Main Documentation](https://github.com/tdk-landscape/tdk-cli/tree/main/docs)
- [Architecture](https://github.com/tdk-landscape/tdk-cli/tree/main/engine/docs)
- [Tilt Extension](https://github.com/tdk-landscape/tdk-cli#using-as-tilt-extension)

---

## 📝 License

MIT © [TDK Landscape](https://github.com/tdk-landscape)

---

<div align="center">

**[⬆️ Back to Top](#-tdk-cli)**

Made with 💚 for developers who ship

</div>
