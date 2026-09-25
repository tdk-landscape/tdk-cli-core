export interface ProjectTemplate {
  repo: string;
  description: string;
}

/** Starter projects `tdk project <name>` can clone. Keep in sync with the public tdk-landscape examples. */
export const PROJECT_TEMPLATES: Record<string, ProjectTemplate> = {
  restaurant: {
    repo: "https://github.com/tdk-landscape/tdk-restaurant-example.git",
    description: "Restaurant ops: reservations, kitchen, floor control (Hono + Vite + Bun)",
  },
  saas: {
    repo: "https://github.com/tdk-landscape/tdk-saas-starter.git",
    description:
      "SaaS starter: account dashboard and a working checkout button (Hono + Vite + Bun)",
  },
  erp: {
    repo: "https://github.com/tdk-landscape/tdk-erp-system.git",
    description: "Enterprise ERP: 100 microservices across 7 business domains",
  },
  "user-management": {
    repo: "https://github.com/tdk-landscape/tdk-user-management.git",
    description: "User/auth management services",
  },
  example: {
    repo: "https://github.com/tdk-landscape/tdk-example.git",
    description: "Minimal Project-Stack-Resource (PSR) demonstration",
  },
};
