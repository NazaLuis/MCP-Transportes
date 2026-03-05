import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

export const logger = pino({
    level: LOG_LEVEL,
    formatters: {
        level(label) {
            return { level: label };
        },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'cert',
            'certificate',
            'privateKey',
            'password',
            'p12Password',
            'keyPassword',
            '*.password',
            '*.privateKey',
        ],
        censor: '[REDACTED]',
    },
});

export function createCorrelationId(): string {
    return uuidv4();
}

export function createChildLogger(correlationId: string) {
    return logger.child({ correlation_id: correlationId });
}
