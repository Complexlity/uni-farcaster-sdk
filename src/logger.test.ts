import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Logger } from "./Logger"; // Adjust the import path based on your file structure

describe("Logger", () => {
  let logger: Logger;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should log info message with correct format", () => {
    logger = new Logger("TestLogger", "info");
    logger.info("This is an info message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLogger]")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("This is an info message")
    );
  });

  it("should log success message with correct format", () => {
    logger = new Logger("TestLogger", "success");
    logger.success("This is a success message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLogger]")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("This is a success message")
    );
  });

  it("should log warning message with correct format", () => {
    logger = new Logger("TestLogger", "warning");
    logger.warning("This is a warning message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLogger]")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("This is a warning message")
    );
  });

  it("should log error message with correct format", () => {
    logger = new Logger("TestLogger", "error");
    logger.error("This is an error message");

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("[TestLogger]")
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("This is an error message")
    );
  });

  it("should not log messages if level does not match", () => {
    logger = new Logger("TestLogger", "error");
    logger.info("This is an info message");
    logger.success("This is a success message");
    logger.warning("This is a warning message");

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("should log all messages if level is undefined", () => {
    logger = new Logger("TestLogger");
    logger.info("This is an info message");
    logger.success("This is a success message");
    logger.warning("This is a warning message");
    logger.error("This is an error message");

    expect(consoleSpy).toHaveBeenCalledTimes(4);
  });
});
