import winston from 'winston';

const { combine, timestamp, colorize, printf, json, errors } = winston.format;

// const isDev = process.env.NODE_ENV !== 'production';
const isDev = true;

// ---------------------------------------------------------------------------
// Console format — human-readable in development
// ---------------------------------------------------------------------------
const consoleFormat = combine(
  errors({ stack: true }),
  timestamp({ format: 'HH:mm:ss' }),
  colorize({ all: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr =
      Object.keys(meta).length > 0 ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
    return `${ts} [${level}] ${stack ?? message}${metaStr}`;
  }),
);

// ---------------------------------------------------------------------------
// JSON format — structured logs for production / log aggregators
// ---------------------------------------------------------------------------
const jsonFormat = combine(errors({ stack: true }), timestamp(), json());

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  transports: [
    new winston.transports.Console({
      format: isDev ? consoleFormat : jsonFormat,
    }),
    // Uncomment for production file logs:
    // new winston.transports.File({ filename: 'logs/error.log', level: 'error', format: jsonFormat }),
    // new winston.transports.File({ filename: 'logs/combined.log', format: jsonFormat }),
  ],
});

export default logger;
