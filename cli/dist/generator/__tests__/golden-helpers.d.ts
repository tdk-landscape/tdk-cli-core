export declare const UPDATE_COMMAND = "UPDATE_GOLDEN=1 bun run test -- golden-generated-output";
/**
 * Compares generated files with the committed golden copies in `goldenDir`. Returns one problem per file that
 * changed, is missing a golden, or has a golden nothing generates any more. With `update` it rewrites the goldens
 * instead and returns nothing, which is how an intentional change is accepted.
 */
export declare function compareWithGolden(actual: Record<string, string>, goldenDir: string, update?: boolean): string[];
