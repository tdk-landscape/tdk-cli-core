import { Command } from "commander";
import { getPackageVersion } from "../utils/paths.js";
export const versionCommand = new Command("version")
    .description("Display version number")
    .alias("v")
    .action(() => {
    console.log(getPackageVersion());
});
//# sourceMappingURL=version.js.map