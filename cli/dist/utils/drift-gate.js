import chalk from "chalk";
import { verifyMasterConfigs } from "../generator/template-engine.js";
/**
 * Check if generated files match service.json.
 * Returns true if verification passes or drift is ignored.
 * Returns false and exits with code 2 if drift is detected and --ignore-drift is not set.
 */
export function checkDriftGate(options) {
    const verifyResult = verifyMasterConfigs(options.projectRoot);
    if (!verifyResult.valid) {
        if (options.ignoreDrift) {
            if (!options.quiet) {
                console.warn(chalk.yellow("\n⚠️  Generated configuration is out of date (--ignore-drift set)"));
                for (const error of verifyResult.errors) {
                    console.warn(chalk.gray(`   - ${error}`));
                }
                console.warn(chalk.gray("\nRun `tdk config regenerate` to update.\n"));
            }
            return true;
        }
        else {
            console.error(chalk.red("\n✗ Generated configuration is out of date"));
            for (const error of verifyResult.errors) {
                console.error(chalk.gray(`   - ${error}`));
            }
            console.error(chalk.gray("\nRun `tdk config regenerate` to fix."));
            process.exit(2);
        }
    }
    return true;
}
//# sourceMappingURL=drift-gate.js.map