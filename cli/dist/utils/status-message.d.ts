export interface StatusMessageController {
    show(message: string, durationMs?: number): void;
    dispose(): void;
}
export declare function createStatusMessageController(setMessage: (message: string) => void): StatusMessageController;
