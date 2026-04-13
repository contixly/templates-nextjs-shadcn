import { Logger, pino } from "pino";
import { isProduction } from "better-auth";

/**
 * Logger instance used for application logging.
 *
 * - In a production environment, the logger is configured to output logs in JSON format at the "warn" level.
 * - In a development environment, the logger is configured to pretty-print logs with colorization at the "debug" level.
 *
 * The logger behavior is dynamically determined based on the value of the `NODE_ENV` environment variable.
 */
export const loggerFactory: Logger = isProduction
  ? // JSON in production
    pino({ level: "info" })
  : // Pretty print in development
    pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
      level: "debug",
    });
