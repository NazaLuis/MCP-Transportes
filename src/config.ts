import { z } from 'zod';

const ENDPOINTS = {
    integration: 'https://presede.mitma.gob.es/MFOM.Services.VTC.Server/VTCPort?wsdl',
    production: 'https://sede.transportes.gob.es/MFOM.Services.VTC.Server/VTCPort?wsdl',
} as const;

const UNAVAILABLE_ENDPOINTS = [
    'https://presede.transportes.gob.es/MFOM.Services.VTC.Server/VTCPort?wsdl',
];

const configSchema = z.object({
    env: z.enum(['integration', 'production']).default('integration'),
    wsdlUrl: z.string().url(),
    cert: z.discriminatedUnion('type', [
        z.object({
            type: z.literal('p12'),
            path: z.string().min(1),
            password: z.string(),
        }),
        z.object({
            type: z.literal('pem'),
            certPath: z.string().min(1),
            keyPath: z.string().min(1),
            keyPassword: z.string().optional(),
        }),
    ]),
    intermediarioNif: z.string().optional(),
    httpTimeoutMs: z.number().int().positive().default(15000),
    httpRetries: z.number().int().min(0).default(2),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    runIntegrationTests: z.boolean().default(false),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
    const env = (process.env.RVTC_ENV || 'integration') as 'integration' | 'production';

    let wsdlUrl = process.env.RVTC_WSDL_URL || ENDPOINTS[env] || ENDPOINTS.integration;

    if (UNAVAILABLE_ENDPOINTS.includes(wsdlUrl)) {
        throw new Error(
            `Endpoint ${wsdlUrl} is not operational. Use ${ENDPOINTS.integration} (integration) or ${ENDPOINTS.production} (production).`
        );
    }

    let cert: Config['cert'];
    if (process.env.RVTC_P12_PATH) {
        cert = {
            type: 'p12' as const,
            path: process.env.RVTC_P12_PATH,
            password: process.env.RVTC_P12_PASSWORD || '',
        };
    } else if (process.env.RVTC_CERT_PATH && process.env.RVTC_KEY_PATH) {
        cert = {
            type: 'pem' as const,
            certPath: process.env.RVTC_CERT_PATH,
            keyPath: process.env.RVTC_KEY_PATH,
            keyPassword: process.env.RVTC_KEY_PASSWORD,
        };
    } else {
        throw new Error(
            'Certificate configuration required. Set RVTC_P12_PATH+RVTC_P12_PASSWORD or RVTC_CERT_PATH+RVTC_KEY_PATH.'
        );
    }

    const intermediarioNif = process.env.RVTC_INTERMEDIARIO_NIF;
    if (env === 'integration' && !intermediarioNif) {
        throw new Error('RVTC_INTERMEDIARIO_NIF is required in integration environment.');
    }

    return configSchema.parse({
        env,
        wsdlUrl,
        cert,
        intermediarioNif,
        httpTimeoutMs: process.env.RVTC_HTTP_TIMEOUT_MS
            ? parseInt(process.env.RVTC_HTTP_TIMEOUT_MS, 10)
            : 15000,
        httpRetries: process.env.RVTC_HTTP_RETRIES
            ? parseInt(process.env.RVTC_HTTP_RETRIES, 10)
            : 2,
        logLevel: (process.env.LOG_LEVEL as Config['logLevel']) || 'info',
        runIntegrationTests: process.env.RVTC_RUN_INTEGRATION_TESTS === 'true',
    });
}

export { ENDPOINTS, UNAVAILABLE_ENDPOINTS };
