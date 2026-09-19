import inquirer from "inquirer";
import type { ValidationResult } from "../types/index.js";
import { showErrorAndExit } from "./errors.js";
import { showCancelled } from "./formatting.js";

export async function confirmAction(message: string, defaultValue = true): Promise<boolean> {
  const { confirm } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirm",
      message,
      default: defaultValue,
    },
  ]);

  if (!confirm) {
    showCancelled();
  }

  return confirm;
}

export function assertValid(
  validation: ValidationResult,
  exitCode: number = 1,
): asserts validation is { valid: true } {
  if (!validation.valid) {
    showErrorAndExit(validation.error ?? "Validation failed", exitCode);
  }
}

export function handleDryRun(
  options: { dryRun?: boolean },
  description: string,
  command: string,
): boolean {
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
export async function confirmOrCancel(message: string, onCancel?: () => void): Promise<boolean> {
  const confirmed = await confirmAction(message, true);
  if (!confirmed) {
    if (onCancel) {
      onCancel();
    }
    return false;
  }
  return true;
}
