import chalk from 'chalk';

export interface Logger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string, err?: Error) => void;
  debug: (msg: string) => void;
}

export class ConsoleLogger implements Logger {
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  info(msg: string): void {
    const timestamp = this.getTimestamp();
    // eslint-disable-next-line no-console
    console.log(chalk.cyan(`[INFO] [${timestamp}]`), msg);
  }
  warn(msg: string): void {
    const timestamp = this.getTimestamp();
    // eslint-disable-next-line no-console
    console.warn(chalk.yellow(`[WARN] [${timestamp}]`), msg);
  }
  error(msg: string, err?: Error): void {
    const timestamp = this.getTimestamp();
    const errorDetails = err 
      ? `\n${chalk.red('Error Stack:')} ${err.stack ?? err.message}`
      : '';
    // eslint-disable-next-line no-console
    console.error(chalk.red(`[ERROR] [${timestamp}]`), msg, errorDetails);
  }
  debug(msg: string): void {
    const isDebugEnabled = process.env.DEBUG === '1' || process.env.VERBOSE === '1';
    if (isDebugEnabled) {
      const timestamp = this.getTimestamp();
      // eslint-disable-next-line no-console
      console.debug(chalk.gray(`[DEBUG] [${timestamp}]`), msg);
    }
  }
}

