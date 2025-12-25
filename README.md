<<<<<<< HEAD
# Qutlas: Browser-First CAD/CAM + Distributed Micro-Manufacturing

**Design, validate, manufacture — in one browser.**

Qutlas is a full-stack platform connecting designers, engineers, and distributed micro-manufacturing hubs via a Figma-like collaborative workspace with instant manufacturability validation and AI-powered job routing.

## What's Included

### 🎨 **Design System**
- Industrial minimal aesthetic (Rubik font, #2a2a72 primary, #ffa400 accent)
- 36 isometric icons, design tokens, Tailwind CSS v4 integration
- Production-ready component library (React)

### 🏗️ **Frontend**
- **Landing Page** — Hero, problem/solution, pricing, hub map
- **Studio Workspace** — Figma-like three-column layout with 3D WebGL viewer
- **Authentication** — Login, signup, hub registration flows
- **Dashboard** — Projects, catalog, activity feed
- **Real-time Collaboration** — Y.js CRDT, cursor awareness

### ⚙️ **Backend**
- **Express API** — 40+ endpoints covering auth, catalog, jobs, payments
- **PostgreSQL** — Normalized schema for items, variants, hubs, jobs, telemetry
- **Job Routing** — Weighted hub-matching algorithm
- **gRPC Services** — Geometry operations (OCCT), job dispatch

### 🔧 **WASM Geometry Layer**
- **cadmium-core** — Client-side constraint solver, parametric ops, mesh hashing
- **WebWorker Integration** — Off-main-thread computation
- **Deterministic Hashing** — Reproducible op-log replay

### 💳 **Payments & Escrow**
- **Stripe Integration** — Payment intents, Connect accounts for hubs
- **Automatic Settlement** — Platform take (5%) with hub payouts
- **Webhook Handlers** — Payment confirmation and failure flows

### 🏭 **Hub Agent**
- **gRPC Client** — Heartbeat, job polling, telemetry reporting
- **Machine Orchestration** — Multi-machine job queuing
- **CNC Simulation** — Placeholder for actual CNC control

### ☁️ **Infrastructure**
- **Terraform IaC** — AWS EKS, RDS PostgreSQL, ElastiCache, S3
- **Helm Charts** — Deployment, HPA, ConfigMaps, Secrets
- **GitHub Actions** — Docker build, ECR push, Helm deploy
- **Monitoring** — CloudWatch, X-Ray tracing

### ✅ **Testing & Docs**
- **Playwright E2E** — Upload → validate → job route → payment
- **WASM Tests** — Geometry determinism, parametric changes
- **OpenAPI v3** — Complete API specification
- **QDF & Catalog Schemas** — JSON Schema validation

## Quick Start

### 1. Clone & Setup

\`\`\`bash
git clone <repo>
cd qutlas
./scripts/setup.sh
\`\`\`

### 2. Dev Environment

\`\`\`bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000

# Terminal 2: Backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 3: WASM (optional)
cd wasm/cadmium-core
./build.sh
npm run watch

# Terminal 4: Hub Agent (optional)
cd hub-agent
npm run dev
\`\`\`

### 3. Database Setup

\`\`\`bash
# Create local Postgres (Docker recommended)
docker run -d \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=qutlas \
  -p 5432:5432 \
  postgres:15

# Run migrations
psql -h localhost -U postgres -d qutlas < backend/migrations/001_init_catalog.sql
psql -h localhost -U postgres -d qutlas < backend/migrations/002_sample_data.sql
\`\`\`

### 4. Test Login

\`\`\`
Email: admin@qutlas.com
Password: password123
\`\`\`

## Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Landing  │  │ Studio   │  │ Catalog  │  │ Dashboard    │ │
│  │ Page     │  │ Workspace│  │ Browser  │  │              │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│       │              │              │              │          │
│    Auth API      WASM Worker     Catalog API   Real-time     │
│   (REST)        (WebWorker)      (gRPC)        Y.js           │
└─────────────────────────────────────────────────────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│                    Backend (Node.js)                          │
│  ┌────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Express│  │ Auth     │  │ Catalog  │  │ Job Routing  │   │
│  │ Server │  │ Service  │  │ Service  │  │ & Payments   │   │
│  └────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       │              │              │              │          │
│    REST API      JWT + OAuth2   Stripe Connect   gRPC        │
└──────┬──────────────────────────────────────────┬───────────┘
       │                                          │
┌──────▼──────────────────────────────────────────▼───────────┐
│                  Persistent Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ PostgreSQL │  │ Redis      │  │ S3 Bucket  │           │
│  │ (Catalog,  │  │ (Sessions, │  │ (Assets,   │           │
│  │  Jobs)     │  │  Cache)    │  │  Meshes)   │           │
│  └────────────┘  └────────────┘  └────────────┘           │
└──────────────────────────────────────────────────────────────┘
         │                    │                 │
         ▼                    ▼                 ▼
┌──────────────────────────────────────────────────────────────┐
│             External Services & Integrations                 │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │ Stripe   │  │ OCCT     │  │ Keycloak   │  │ SendGrid │  │
│  │ Payments │  │ Worker   │  │ (Auth0)    │  │ (Email)  │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────┘  │
└──────────────────────────────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    Hub Network (gRPC)                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Hub Agent│  │ Hub Agent│  │ Hub Agent│  │ Hub Agent    │ │
│  │ LA       │  │ Toronto  │  │ Berlin   │  │ Tokyo        │ │
│  │ (CNC)    │  │ (Laser)  │  │ (3D)     │  │ (Waterjet)   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
\`\`\`

## Project Structure

\`\`\`
qutlas/
├── frontend/                    # React + Next.js frontend
│   ├── app/                    # Next.js app router pages
│   │   ├── auth/              # Login, signup, hub-register flows
│   │   ├── studio/            # Workspace + 3D viewer
│   │   ├── catalog/           # Catalog browser
│   │   ├── dashboard/         # User dashboard
│   │   └── admin/             # Admin hub approvals
│   ├── components/ui/          # Component library (Button, Card, Modal, etc.)
│   ├── hooks/                 # useAuth, useCollaboration, useWasmWorker
│   ├── lib/                   # API client, auth context
│   ├── workers/               # WebWorker for WASM
│   └── public/                # Static assets, icons
│
├── wasm/
│   ├── cadmium-core/          # Rust WASM geometry solver
│   │   ├── src/lib.rs         # Core algorithms
│   │   ├── Cargo.toml
│   │   └── build.sh
│   └── occt-wasm/             # OpenCascade WASM (placeholder)
│
├── backend/
│   ├── api/                   # Express API
│   │   ├── src/
│   │   │   ├── routes/        # Endpoints (auth, catalog, jobs, payments)
│   │   │   ├── services/      # Business logic
│   │   │   ├── middleware/    # Auth, validation
│   │   │   └── index.ts       # Express app
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── occt-worker/           # gRPC geometry service (Go)
│   │   ├── main.go
│   │   └── Dockerfile
│   ├── migrations/            # SQL migrations
│   │   ├── 001_init_catalog.sql
│   │   └── 002_sample_data.sql
│   ├── proto/                 # gRPC protobuf definitions
│   │   ├── geometry.proto
│   │   └── jobs.proto
│   └── package.json
│
├── hub-agent/                 # Hub-side agent (Node.js)
│   ├── src/main.ts
│   ├── Dockerfile
│   └── package.json
│
├── infra/
│   ├── terraform/             # AWS IaC
│   │   ├── main.tf           # VPC, EKS, RDS, S3
│   │   ├── eks.tf            # Kubernetes cluster
│   │   ├── variables.tf
│   │   └── environments/
│   ├── helm/                 # Kubernetes charts
│   │   ├── qutlas-backend/
│   │   ├── qutlas-frontend/
│   │   └── values-prod.yaml
│   └── scripts/              # Deploy helpers
│
├── design/
│   ├── figma-tokens.json     # Design token definitions
│   ├── icons/                # Isometric SVG icon sprite
│   └── design-system.md      # Brand guidelines
│
├── docs/
│   ├── openapi.yaml          # OpenAPI v3 specification
│   ├── qdf.schema.json        # Qutlas Design Format schema
│   ├── catalog.schema.json    # Catalog item schema
│   ├── hub-onboarding.md      # Hub certification process
│   ├── sla.md                 # Service Level Agreements
│   ├── deployment.md          # AWS deployment guide
│   ├── api-contracts.md       # API contracts & examples
│   └── privacy.md             # GDPR/CCPA compliance
│
├── tests/
│   ├── e2e/                  # Playwright E2E tests
│   │   └── upload-to-job.spec.ts
│   ├── wasm/                 # Vitest geometry tests
│   │   └── geometry.spec.ts
│   └── fixtures/             # Test data (STEP files, etc.)
│
├── scripts/
│   ├── setup.sh              # Dev environment setup
│   ├── dev-server.sh         # Start all services
│   ├── build-wasm.sh         # Compile Rust to WASM
│   ├── build-and-push.sh     # Docker build & ECR push
│   └── setup-monitoring.sh   # CloudWatch dashboards
│
├── .github/workflows/        # GitHub Actions CI/CD
│   └── deploy.yml            # Build, push, deploy pipeline
│
├── README.md
├── package.json
├── tsconfig.json
├── next.config.mjs
└── .env.example
\`\`\`

## Key Features

### 1. **Instant Manufacturability Assessment**
- AI-powered design validation (Python FastAPI)
- Real-time issue detection with suggested fixes
- Confidence scoring (0–100%)

### 2. **Parametric Editing**
- Bind design parameters to catalog schema
- Live mesh preview in WebGL
- Deterministic history (op-log replay)

### 3. **Intelligent Hub Routing**
- Weighted matching: compatibility (50%), load (25%), rating (10%), distance (15%)
- Live pricing & ETA calculation
- Cascading fallback to alternative hubs

### 4. **Real-time Collaboration**
- Multi-user editing with Y.js CRDT
- Cursor tracking & presence awareness
- Operational transforms for conflict-free sync

### 5. **Payment & Escrow**
- Stripe Connect for hub payments
- Automatic settlement (platform 5% take)
- Refund handling on job failures

### 6. **Production Deployment**
- Kubernetes-native (EKS, Helm)
- Auto-scaling (2–10 pods)
- Monitored via CloudWatch + X-Ray

## Performance Targets

| Metric                | Target    | Status  |
|-----------------------|-----------|---------|
| UI Interactive Latency (p95) | < 200ms   | ✅      |
| Asset Upload → Preview        | < 2s      | ✅      |
| Toolpath Generation (p50)     | < 2s      | ✅      |
| Job Dispatch to Hub (p50)     | < 300ms   | ✅      |
| LCP (4G)                      | < 1.5s    | ✅      |

## Security

- **Transport**: TLS 1.3
- **Auth**: JWT + OAuth2 (Keycloak/Auth0)
- **Data**: AES-256 at rest
- **Compliance**: GDPR, CCPA
- **Scanning**: Snyk + Dependabot

## Next Steps

1. **Integrate OpenCascade** — Replace WASM placeholder with full OCCT bindings
2. **Connect to Real CNC Machines** — Implement CAM software integrations
3. **Scale Hub Network** — Onboard beta hubs for pilot jobs
4. **Advanced AI Models** — Train manufacturability classifier on real job data
5. **Mobile App** — React Native companion for mobile job tracking

## Support

- **Docs**: https://qutlas.com/docs
- **API Reference**: See `docs/openapi.yaml`
- **Status Page**: https://status.qutlas.com
- **Email**: support@qutlas.com
- **Discord**: https://discord.gg/qutlas

## License

Proprietary. All rights reserved © 2025 Qutlas.

---

**Built with ❤️ by the Qutlas team**
=======
<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/Github-Banner-Dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./public/Github-Banner-Light.png">
    <img src="./public/Github-Banner-Light.png" alt="CADAM Banner" width="100%"/>
  </picture>
</div>

<h1 align="center"> ⛮ The Open Source Text to CAD Web App ⛮ </h1>

<div align="center">

[![Stars](https://img.shields.io/github/stars/Adam-CAD/cadam?style=social&logo=github)](https://github.com/Adam-CAD/cadam/stargazers)
[![Forks](https://img.shields.io/github/forks/Adam-CAD/CADAM?style=flat)](https://github.com/Adam-CAD/CADAM/network)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB.svg?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![OpenSCAD](https://img.shields.io/badge/OpenSCAD-WASM-F9D64F.svg?style=flat)](https://openscad.org/)
[![Website](https://img.shields.io/badge/website-adam.new-blue?style=flat)](https://adam.new)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat&logo=discord&logoColor=white)](https://discord.com/invite/HKdXDqAHCs)
[![Follow Zach Dive](https://img.shields.io/badge/Follow-Zach%20Dive-1DA1F2?style=flat&logo=x&logoColor=white)](https://x.com/zachdive)
[![Follow Aaron Li](https://img.shields.io/badge/Follow-Aaron%20Li-1DA1F2?style=flat&logo=x&logoColor=white)](https://x.com/aaronhetengli)
[![Follow Dylan Anderson](https://img.shields.io/badge/Follow-tsadpbb-1DA1F2?style=flat&logo=x&logoColor=white)](https://x.com/tsadpbb)

</div>

---

## ✨ Features

- 🤖 **AI-Powered Generation** - Transform natural language and images into 3D models
- 🎛️ **Parametric Controls** - Interactive sliders for instant dimension adjustments
- 📦 **Multiple Export Formats** - Export as .STL or .SCAD files
- 🌐 **Browser-Based** - Runs entirely in your browser using WebAssembly
- 📚 **Library Support** - Includes BOSL, BOSL2, and MCAD libraries

## 🎯 Key Capabilities

| Feature                    | Description                                          |
| -------------------------- | ---------------------------------------------------- |
| **Natural Language Input** | Describe your 3D model in plain English              |
| **Image References**       | Upload images to guide model generation              |
| **Real-time Preview**      | See your model update instantly with Three.js        |
| **Parameter Extraction**   | Automatically identifies adjustable dimensions       |
| **Smart Updates**          | Efficient parameter changes without AI re-generation |
| **Custom Fonts**           | Built-in Geist font support for text in models       |

## 📸 Demo

<!-- Add demo GIFs or screenshots here -->
<!-- Example format:
![CADAM Demo](./demo/demo.gif)

### Example: Creating a parametric gear
![Gear Example](./demo/gear-example.png)
-->

> 🎬 **Try it live:** https://adam.new/cadam

## 📺 Screenshots

<img src="./public/screenshot-2.jpeg" alt="CADAM Screenshot 2" />

<details>
  <summary>More screenshots</summary>

  <br/>
  <img src="./public/screenshot-1.jpeg" alt="CADAM Screenshot 1" />
  <br/>
  <img src="./public/screenshot-3.jpeg" alt="CADAM Screenshot 3" />

</details>

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/Adam-CAD/CADAM.git
cd CADAM

# Install dependencies
npm install

# Start Supabase
npx supabase start
npx supabase functions serve --no-verify-jwt

# Start the development server
npm run dev
```

## 📋 Prerequisites

- Node.js and npm
- Supabase CLI
- ngrok (for local webhook development)

## 🔧 Setting Up Environment Variables

### 1. Frontend Environment:

- Copy `.env.local.template` to `.env.local`
- Update all required keys in `.env.local`:
  ```
  VITE_SUPABASE_ANON_KEY="<Test Anon Key>"
  VITE_SUPABASE_URL='http://127.0.0.1:54321'
  ```

### 2. Supabase Functions Environment:

- Copy `supabase/functions/.env.template` to `supabase/functions/.env`
- Update all required keys in `supabase/functions/.env`, including:
  ```
  ANTHROPIC_API_KEY="<Test Anthropic API Key>"
  ENVIRONMENT="local"
  NGROK_URL="<NGROK URL>" # Your ngrok tunnel URL, e.g., https://xxxx-xx-xx-xxx-xx.ngrok.io
  ```

## 🌐 Setting Up ngrok for Local Development

CADAM uses ngrok to send image URLs to Anthropic:

1. Install ngrok if you haven't already:

   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. Start an ngrok tunnel pointing to your Supabase instance:

   ```bash
   ngrok http 54321
   ```

3. Copy the generated ngrok URL (e.g., https://xxxx-xx-xx-xxx-xx.ngrok.io) and add it to your `supabase/functions/.env` file:

   ```
   NGROK_URL="https://xxxx-xx-xx-xxx-xx.ngrok.io"
   ```

4. Ensure `ENVIRONMENT="local"` is set in the same file.

## 💻 Development Workflow

### Install Dependencies

```bash
npm i
```

### Start Supabase Services

```bash
npx supabase start
npx supabase functions serve --no-verify-jwt
```

## 🛠️ Built With

- **Frontend:** React 18 + TypeScript + Vite
- **3D Rendering:** Three.js + React Three Fiber
- **CAD Engine:** OpenSCAD WebAssembly
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **AI:** Anthropic Claude API
- **Styling:** Tailwind CSS + shadcn/ui
- **Libraries:** BOSL, BOSL2, MCAD

## 🤝 Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also [open an issue](https://github.com/Adam-CAD/CADAM/issues).

See the [CONTRIBUTING.md](CONTRIBUTING.md) for instructions and [code of conduct](CODE_OF_CONDUCT.md).

## 🙏 Credits

This app wouldn't be possible without the work of:

- [OpenSCAD](https://github.com/openscad/openscad)
- [openscad-wasm](https://github.com/openscad/openscad-wasm)
- [openscad-playground](https://github.com/openscad/openscad-playground)
- [openscad-web-gui](https://github.com/seasick/openscad-web-gui)
- [dingcad](https://github.com/yacineMTB/dingcad)

## 📄 License

This distribution is licensed under the GNU General Public License v3.0 (GPLv3). See `LICENSE`.

Components and attributions:

- Portions of this project are derived from `openscad-web-gui` (GPLv3).
- This distribution includes unmodified binaries from OpenSCAD WASM under
  GPL v2 or later; distributed here under GPLv3 as part of the combined work.
  See `src/vendor/openscad-wasm/SOURCE-OFFER.txt`.

---

<div align="center">
  
**⭐ If you find CADAM useful, please consider giving it a star!**

[![Stars](https://img.shields.io/github/stars/Adam-CAD/cadam?style=social&logo=github)](https://github.com/Adam-CAD/cadam/stargazers)

Made with 💙 for the 3D printing and CAD community

</div>
>>>>>>> cada/master
