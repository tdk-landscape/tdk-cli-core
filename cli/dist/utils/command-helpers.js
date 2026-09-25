import { showErrorAndExit } from "./errors.js";
import { showCancelled } from "./formatting.js";
import { promptConfirm } from "./prompt.js";
export async function confirmAction(message, defaultValue = true) {
    const confirm = await promptConfirm({ message, initial: defaultValue });
    if (!confirm) {
        showCancelled();
    }
    return confirm;
}
export function assertValid(validation, exitCode = 1) {
    if (!validation.valid) {
        showErrorAndExit(validation.error ?? "Validation failed", exitCode);
    }
}
export function handleDryRun(options, description, command) {
    if (options.dryRun) {
        console.log(`Dry run - ${description}`);
        console.log(`Would run: ${command}`);
        return true;
    }
    return false;
}
/**
 * Prompt for confirmation with cancellation handling.
 * Displays a confirmation prompt and exits/cancels if user declines.
 * @param message - The confirmation message to display
 * @param onCancel - Optional callback when user cancels (defaults to returning false)
 * @returns Promise<boolean> - true if confirmed, false if cancelled (with callback)
 */
export async function confirmOrCancel(message, onCancel) {
    const confirmed = await confirmAction(message, true);
    if (!confirmed) {
        if (onCancel) {
            onCancel();
        }
        return false;
    }
    return true;
}
//# sourceMappingURL=command-helpers.js.map