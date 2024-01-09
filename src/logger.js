import chalk from "chalk";
import util from "node:util";

util.inspect.defaultOptions.depth = null;

export class ConsoleLogger {
  blankLine() {
    console.log("");
  }

  bold(msg) {
    return chalk.bold(msg);
  }

  warning(msg, ...args) {
    console.log(chalk.yellow(msg), ...args);
  }

  error(msg, ...args) {
    console.error(chalk.red(msg), ...args);
  }

  success(msg, ...args) {
    console.log(chalk.green(msg), ...args);
  }

  info(msg, ...args) {
    console.log(msg, ...args);
  }

  log(...args) {
    console.log(...args);
  }

  red(msg) {
    return chalk.red(msg);
  }

  green(msg) {
    return chalk.green(msg);
  }

  yellow(msg) {
    return chalk.yellow(msg);
  }

  blue(msg) {
    return chalk.blue(msg);
  }

  successWithCode(code, msg, ...args) {
    console.log(`${chalk.green(code)} - ${msg}`, ...args);
  }

  errorWithCode(code, msg, ...args) {
    console.log(`${chalk.red(code)} - ${msg}`, ...args);
  }

  warningWithCode(code, msg, ...args) {
    console.log(`${chalk.yellow(code)} - ${msg}`, ...args);
  }
}
export const logger = new ConsoleLogger();
