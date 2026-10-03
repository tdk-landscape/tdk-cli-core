import type { Command } from "commander";
/**
 * `tdk help <name>` should fail for a name that is not a command or alias, like `tdk <name>` does.
 * Returns the unknown name, or undefined when the arguments are not `help <name>` or the name is known.
 */
export declare function unknownHelpTarget(args: string[], commands: readonly Command[]): string | undefined;
//# sourceMappingURL=help-command.d.ts.map