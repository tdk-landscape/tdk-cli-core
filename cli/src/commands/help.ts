import chalk from "chalk";

const TDK_BANNER = `
${chalk.cyan("╔════════════════════════════════════════════════════════════╗")}
${chalk.cyan("║")}                                                            ${chalk.cyan("║")}
${chalk.cyan("║")}     ${chalk.bold.white("████████╗██████╗ ██╗  ██╗")}    ${chalk.bold.white("██████╗██╗     ██╗")}            ${chalk.cyan("║")}
${chalk.cyan("║")}     ${chalk.bold.white("╚══██╔══╝██╔══██╗██║ ██╔╝")}   ${chalk.bold.white("██╔════╝██║     ██║")}            ${chalk.cyan("║")}
${chalk.cyan("║")}        ${chalk.bold.white("██║   ██║  ██║█████╔╝")}    ${chalk.bold.white("██║     ██║     ██║")}            ${chalk.cyan("║")}
${chalk.cyan("║")}        ${chalk.bold.white("██║   ██║  ██║██╔═██╗")}    ${chalk.bold.white("██║     ██║     ██║")}            ${chalk.cyan("║")}
${chalk.cyan("║")}        ${chalk.bold.white("██║   ██████╔╝██║  ██╗")}${chalk.yellow("██╗")}${chalk.bold.white("╚██████╗███████╗██║")}            ${chalk.cyan("║")}
${chalk.cyan("║")}        ${chalk.white("╚═╝   ╚═════╝ ╚═╝  ╚═╝╚═╝")} ${chalk.white("╚═════╝╚══════╝╚═╝")}            ${chalk.cyan("║")}
${chalk.cyan("║")}                                                            ${chalk.cyan("║")}
${chalk.cyan("║")}          ${chalk.bold.yellow("🚀 Tilt Development Kit - Local Microservices")}             ${chalk.cyan("║")}
${chalk.cyan("║")}                                                            ${chalk.cyan("║")}
${chalk.cyan("╚════════════════════════════════════════════════════════════╝")}
`;

const COMMAND_GROUPS = [
  {
    title: "🌍 Project Level",
    emoji: "📁",
    color: chalk.blue,
    commands: [
      {
        name: "project",
        desc: "Initialize master configs (TILT_RESOURCE_DEFAULTS.star)",
        alias: "",
      },
      { name: "projects, info", desc: "Show project information and config status", alias: "" },
    ],
  },
  {
    title: "📦 Stack Level",
    emoji: "📦",
    color: chalk.magenta,
    commands: [
      { name: "stack", desc: "Organize resources into stacks (interactive)", alias: "" },
      { name: "stacks, ls", desc: "List all stacks and their resources", alias: "" },
    ],
  },
  {
    title: "⚡ Resource Level",
    emoji: "⚡",
    color: chalk.yellow,
    commands: [
      { name: "resource", desc: "Create new resource with templates", alias: "" },
      { name: "resources", desc: "List all resources with filtering", alias: "--stack, --ports" },
    ],
  },
  {
    title: "🔄 Lifecycle",
    emoji: "🔄",
    color: chalk.green,
    commands: [
      { name: "up, deploy", desc: "Start services (optionally by stack)", alias: "[stack-name]" },
      { name: "down", desc: "Stop all tilt resources", alias: "" },
      { name: "status", desc: "Show status of services and stacks", alias: "" },
    ],
  },
  {
    title: "🌐 Networking",
    emoji: "🌐",
    color: chalk.blueBright,
    commands: [
      {
        name: "networks, traefik",
        desc: "Show Traefik-routed URLs for all services",
        alias: "--stack, --json",
      },
    ],
  },
  {
    title: "🛠️ Utilities",
    emoji: "🛠️",
    color: chalk.cyan,
    commands: [
      { name: "ui, interactive", desc: "Interactive TUI for managing services", alias: "" },
      {
        name: "config",
        desc: "Manage project configuration and regenerate master files",
        alias: "regenerate, verify, edit",
      },
      { name: "doctor", desc: "Check environment readiness", alias: "" },
      { name: "completion", desc: "Generate shell completions", alias: "--install --shell zsh" },
      { name: "upgrade, update", desc: "Self-update to latest version", alias: "--force" },
      { name: "version, -v", desc: "Display version number", alias: "" },
      { name: "help", desc: "Show this colorful help", alias: "[command]" },
    ],
  },
];

function formatCommand(
  name: string,
  desc: string,
  alias: string,
  color: (text: string) => string,
): string {
  const nameFormatted = color(name.padEnd(20));
  const descFormatted = chalk.white(desc);
  const aliasFormatted = alias ? chalk.gray(` ${alias}`) : "";
  return `  ${nameFormatted} ${descFormatted}${aliasFormatted}`;
}

export function showHelp(): void {
  console.log(TDK_BANNER);

  console.log(chalk.bold.white("\n  Project → Phase → Stack → Resource (PPSR) Model\n"));

  console.log(chalk.gray("  Usage: tdk [command] [options]\n"));

  console.log(chalk.bold.yellow("  Global Options:"));
  console.log(
    `  ${chalk.cyan("-v, --version".padEnd(20))} ${chalk.white("Display version number")}`,
  );
  console.log(`  ${chalk.cyan("--verbose".padEnd(20))} ${chalk.white("Enable verbose output")}`);
  console.log(`  ${chalk.cyan("-h, --help".padEnd(20))} ${chalk.white("Show help")}`);
  console.log();

  for (const group of COMMAND_GROUPS) {
    console.log(group.color.bold(`${group.emoji} ${group.title}`));
    console.log(group.color(`  ${"─".repeat(50)}`));

    for (const cmd of group.commands) {
      console.log(formatCommand(cmd.name, cmd.desc, cmd.alias, group.color));
    }

    console.log();
  }
  console.log(chalk.bold.yellow("  🚀 Quick Start:"));
  console.log(chalk.gray(`  ${"─".repeat(50)}`));
  console.log(
    chalk.white(`
  ${chalk.cyan("1.")} Initialize project:        ${chalk.green("tdk project")}
  ${chalk.cyan("2.")} Create a resource:         ${chalk.green("tdk resource my-api --type backend")}
  ${chalk.cyan("3.")} Assign to stack:           ${chalk.green("tdk stack my-stack")}
  ${chalk.cyan("4.")} Start development:         ${chalk.green("tdk up my-stack")}
  `),
  );
  console.log(chalk.bold.yellow("  💡 Examples:"));
  console.log(chalk.gray(`  ${"─".repeat(50)}`));
  console.log(
    chalk.white(`
  ${chalk.cyan("$")} tdk project                          # Create master configs
  ${chalk.cyan("$")} tdk resource api --type backend      # Create backend service
  ${chalk.cyan("$")} tdk resource app --type frontend       # Create frontend app
  ${chalk.cyan("$")} tdk stacks --services                  # List stacks with resources
  ${chalk.cyan("$")} tdk up my-stack                        # Start a stack
  ${chalk.cyan("$")} tdk networks                          # Show Traefik-routed URLs
  ${chalk.cyan("$")} tdk doctor                           # Check environment
  ${chalk.cyan("$")} tdk upgrade                          # Self-update
  `),
  );
  console.log(chalk.gray(`  ${"═".repeat(50)}`));
  console.log(chalk.gray(`  For more help: ${chalk.cyan("tdk help [command]}")}`));
  console.log(
    chalk.gray(`  GitHub: ${chalk.cyan("https://github.com/tdk-landscape/tdk-cli-core")}`),
  );
  console.log();
  console.log(chalk.green.bold("  Happy coding! 🚀\n"));
}
