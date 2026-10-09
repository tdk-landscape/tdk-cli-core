/**
 * Replaces `filePath` in one step. A plain writeFileSync truncates first, so an interrupt mid-write leaves a
 * half-written file that looks current; here readers see the old content or the new content, never a mix.
 */
export declare function writeTextFileAtomic(filePath: string, content: string): void;
