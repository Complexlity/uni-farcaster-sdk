const colors = {
  yellow: (text: string) => {
    return `\x1b[33m${text}\x1b[0m`;
  },

  blue: (text: string) => {
    return `\x1b[34m${text}\x1b[0m`;
  },
  gray: (text: string) => {
    return `\x1b[90m${text}\x1b[0m`;
  },
  red: (text: string) => {
    return `\x1b[31m${text}\x1b[0m`;
  },
  green: (text: string) => {
    return `\x1b[32m${text}\x1b[0m`;
  },
};

export const LogLevel = ["info", "success", "warning", "error"] as const;
export type LogLevel = (typeof LogLevel)[number];

export type LogColors = keyof typeof colors;

export class Logger implements ILogger {
  private name: string;
  private level: LogLevel | undefined;

  constructor(name: string, level?: LogLevel) {
    this.name = name;
    this.level = level;
  }

  public info(text: string) {
    const timestamp = this.formatTimestamp(new Date());
    if (this.level === "info" || this.level === undefined) {
      console.log(
        colors.blue(`[${timestamp}] [${this.name}] `) + colors.gray(text),
      );
    }
  }

  public success(text: string) {
    const timestamp = this.formatTimestamp(new Date());
    if (this.level === "success" || this.level === undefined) {
      console.log(
        colors.green(`[${timestamp}] [${this.name}] `) + colors.gray(text),
      );
    }
  }

  public warning(text: string) {
    const timestamp = this.formatTimestamp(new Date());
    if (this.level === "warning" || this.level === undefined) {
      console.log(
        colors.yellow(`[${timestamp}] [${this.name}] `) + colors.gray(text),
      );
    }
  }

  public error(text: string) {
    const timestamp = this.formatTimestamp(new Date());

    if (this.level === "error" || this.level === undefined) {
      console.log(
        colors.red(`[${timestamp}] [${this.name}] `) + colors.gray(text),
      );
    }
  }

  private formatTimestamp(timestamp: Date): string {
    return `${timestamp.toLocaleTimeString(
      "en-GB",
    )}:${timestamp.getMilliseconds()}`;
  }
}

export class Noop implements ILogger {
  public info(_text: string) {}
  public success(_text: string) {}
  public warning(_text: string) {}
  public error(_text: string) {}
}

interface ILogger {
  info(text: string): void;
  success(text: string): void;
  warning(text: string): void;
  error(text: string): void;
}
const logger = new Logger("TestLogger", "error");
logger.info("This is an info message");
logger.success("This is a success message");
logger.warning("This is a warning message");
