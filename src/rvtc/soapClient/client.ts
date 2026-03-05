/**
 * SOAP client: sends signed SOAP messages over HTTPS to the RVTC endpoint.
 * Implements retry logic for transient failures only.
 */

import type { Config } from '../../config.js';
import type { SoapOperation, RvtcResponse } from '../types.js';
import { SOAP_ACTIONS } from '../types.js';
import { parseResponse } from './responseParser.js';
import type { CertificateData } from '../wsse/certs.js';
import { signSoapMessage } from '../wsse/signer.js';
import type { Logger } from 'pino';

export interface SoapClientOptions {
    config: Config;
    certData: CertificateData;
    logger: Logger;
}

export class SoapClient {
    private config: Config;
    private certData: CertificateData;
    private logger: Logger;

    constructor(opts: SoapClientOptions) {
        this.config = opts.config;
        this.certData = opts.certData;
        this.logger = opts.logger;
    }

    /**
     * Send a SOAP request for the given operation.
     * @param operation - The SOAP operation name
     * @param unsignedXml - The unsigned SOAP XML
     * @returns Parsed RvtcResponse
     */
    async send(operation: SoapOperation, unsignedXml: string): Promise<RvtcResponse> {
        const startTime = Date.now();

        // Sign the XML
        const signedXml = signSoapMessage(unsignedXml, this.certData);

        this.logger.debug({ operation, xmlLength: signedXml.length }, 'Sending SOAP request');

        // Remove ?wsdl from the URL to get the actual endpoint
        const endpointUrl = this.config.wsdlUrl.replace(/\?wsdl$/i, '');
        const soapAction = SOAP_ACTIONS[operation];

        let lastError: Error | null = null;
        const maxAttempts = 1 + this.config.httpRetries;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await this.doRequest(endpointUrl, soapAction, signedXml);
                const latency = Date.now() - startTime;

                this.logger.info(
                    { operation, latency, statusCode: response.status, attempt },
                    'SOAP response received'
                );

                if (!response.ok && response.status >= 500) {
                    // Server error: retryable
                    const bodyText = await response.text();
                    lastError = new Error(`HTTP ${response.status}: ${bodyText.slice(0, 500)}`);
                    this.logger.warn(
                        { operation, attempt, status: response.status },
                        'Server error, retrying...'
                    );
                    continue;
                }

                const responseXml = await response.text();

                // Parse the response - never retry functional SOAP responses
                const result = parseResponse(responseXml);
                const totalLatency = Date.now() - startTime;

                this.logger.info(
                    {
                        operation,
                        resultado: result.resultado,
                        ok: result.ok,
                        latency: totalLatency,
                        idServicio: result.idServicio,
                    },
                    result.ok ? 'Operation successful' : 'Operation returned error'
                );

                return result;
            } catch (err) {
                const error = err as Error;
                lastError = error;
                const isRetryable = isTransientError(error);

                if (isRetryable && attempt < maxAttempts) {
                    this.logger.warn(
                        { operation, attempt, error: error.message },
                        'Transient error, retrying...'
                    );
                    // Simple backoff
                    await sleep(attempt * 1000);
                    continue;
                }

                // Non-retryable or exhausted retries
                throw error;
            }
        }

        throw lastError || new Error('Request failed after all retries.');
    }

    private async doRequest(url: string, soapAction: string, body: string): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.httpTimeoutMs);

        try {
            return await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `"${soapAction}"`,
                },
                body,
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }
    }
}

function isTransientError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
        error.name === 'AbortError' ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('epipe') ||
        message.includes('enotfound') ||
        message.includes('network') ||
        message.includes('socket')
    );
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
