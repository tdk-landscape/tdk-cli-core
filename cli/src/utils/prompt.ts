import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

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

async function question(prompt: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(prompt)).trim();
  } finally {
    rl.close();
  }
}

export async function promptText(options: TextPromptOptions): Promise<string> {
  const suffix = options.initial ? ` (${options.initial})` : "";

  while (true) {
    const answer = await question(`${options.message}${suffix} `);
    const value = answer || options.initial || "";
    const validation = options.validate?.(value) ?? true;

    if (validation === true) {
      return value;
    }

    console.log(validation);
  }
}

export async function promptConfirm(options: ConfirmPromptOptions): Promise<boolean> {
  const defaultValue = options.initial ?? true;
  const suffix = defaultValue ? "Y/n" : "y/N";

  while (true) {
    const answer = (await question(`${options.message} (${suffix}) `)).toLowerCase();
    if (!answer) return defaultValue;
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;
    console.log("Please answer yes or no.");
  }
}

export async function promptSelect<T extends string>(
  options: ChoicePromptOptions<T>,
): Promise<T> {
  console.log(options.message);
  options.choices.forEach((choice, index) => {
    console.log(`  ${index + 1}. ${choice.title}`);
  });

  while (true) {
    const answer = await question("Choose one: ");
    const selectedIndex = Number.parseInt(answer, 10) - 1;
    const selected = options.choices[selectedIndex];

    if (selected) {
      return selected.value;
    }

    console.log(`Enter a number from 1 to ${options.choices.length}.`);
  }
}

export async function promptMultiSelect<T extends string>(
  options: MultiSelectPromptOptions<T>,
): Promise<T[]> {
  const defaults = options.choices
    .map((choice, index) => (choice.selected ? index + 1 : null))
    .filter((index): index is number => index !== null);
  const defaultHint = defaults.length > 0 ? ` [${defaults.join(",")}]` : "";

  console.log(options.message);
  options.choices.forEach((choice, index) => {
    const marker = choice.selected ? "*" : " ";
    console.log(` ${marker} ${index + 1}. ${choice.title}`);
  });

  while (true) {
    const answer = await question(`Choose one or more numbers, comma-separated${defaultHint}: `);
    const rawIndexes = answer
      ? answer.split(",").map((value) => Number.parseInt(value.trim(), 10))
      : defaults;

    const selected = Array.from(new Set(rawIndexes))
      .map((index) => options.choices[index - 1])
      .filter((choice): choice is Choice<T> => Boolean(choice))
      .map((choice) => choice.value);

    const validation = options.validate?.(selected) ?? true;
    if (validation === true) {
      return selected;
    }

    console.log(validation);
  }
}
