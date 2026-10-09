/** Minimal ora-style spinner: animates on a TTY, prints plain lines otherwise. */
export interface Spinner {
    text: string;
    succeed(message?: string): void;
    fail(message?: string): void;
    warn(message?: string): void;
}
export declare function startSpinner(initialText: string): Spinner;
