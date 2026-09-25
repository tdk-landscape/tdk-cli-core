type ValidationResult = true | string;
interface TextPromptOptions {
    message: string;
    initial?: string;
    validate?: (input: string) => ValidationResult;
}
interface ConfirmPromptOptions {
    message: string;
    initial?: boolean;
}
interface Choice<T extends string> {
    title: string;
    value: T;
    selected?: boolean;
}
interface ChoicePromptOptions<T extends string> {
    message: string;
    choices: Choice<T>[];
}
interface MultiSelectPromptOptions<T extends string> extends ChoicePromptOptions<T> {
    validate?: (input: T[]) => ValidationResult;
}
export declare function promptText(options: TextPromptOptions): Promise<string>;
export declare function promptConfirm(options: ConfirmPromptOptions): Promise<boolean>;
export declare function promptSelect<T extends string>(options: ChoicePromptOptions<T>): Promise<T>;
export declare function promptMultiSelect<T extends string>(options: MultiSelectPromptOptions<T>): Promise<T[]>;
export {};
//# sourceMappingURL=prompt.d.ts.map