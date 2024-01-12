import PromptSync from "prompt-sync";
import { logger } from "./logger.js";

export const prompt = PromptSync({ sigint: true });

export function confirm(ask) {
  const result = prompt(logger.yellow(ask + " [y/n]"));
  return result.toLowerCase() === "y";
}
