/** SOAP response XML parser → RvtcResponse */

import { XMLParser } from 'fast-xml-parser';
import type { RvtcResponse } from '../types.js';
import { getResultMessage } from '../resultCodes.js';

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
    parseAttributeValue: false,
    trimValues: true,
});

/**
 * Parse a SOAP response XML string into a uniform RvtcResponse.
 * Handles both success (resultado=00) and error responses.
 */
export function parseResponse(rawXml: string): RvtcResponse {
    const parsed = parser.parse(rawXml);

    // Navigate: Envelope → Body → <operation response> → header + body
    const envelope = parsed.Envelope || parsed['soapenv:Envelope'] || parsed['soap:Envelope'];
    if (!envelope) {
        throw new Error('Invalid SOAP response: no Envelope found.');
    }

    const body = envelope.Body || envelope['soapenv:Body'] || envelope['soap:Body'];
    if (!body) {
        throw new Error('Invalid SOAP response: no Body found.');
    }

    // The body contains the operation response element (e.g. qaltavtcResponse)
    // We need to find the first child that is a response element
    let responseBody: Record<string, unknown> | undefined;

    // Try to find the response payload - it could be nested under various names
    for (const key of Object.keys(body)) {
        if (key.startsWith('@')) continue;
        const child = body[key] as Record<string, unknown>;
        if (child && typeof child === 'object' && 'body' in child) {
            responseBody = child.body as Record<string, unknown>;
            break;
        }
        // Check if the body key directly contains resultado
        if (child && typeof child === 'object') {
            // Look one level deeper
            for (const subKey of Object.keys(child)) {
                if (subKey === 'body') {
                    responseBody = child[subKey] as Record<string, unknown>;
                    break;
                }
            }
            if (responseBody) break;
        }
    }

    // Fallback: try direct body.body
    if (!responseBody && body.body) {
        responseBody = body.body as Record<string, unknown>;
    }

    if (!responseBody) {
        throw new Error('Invalid SOAP response: cannot find response body element.');
    }

    const resultado = String(
        responseBody['@_resultado'] || responseBody.resultado || ''
    );
    const idError = parseOptionalLong(responseBody['@_iderror'] || responseBody.iderror);

    let idServicio: number | null = null;
    let idComunica: number | null = null;

    // Extract from vtcservicio node
    const vtcServicio = responseBody.vtcservicio as Record<string, unknown> | undefined;
    if (vtcServicio) {
        idServicio = parseOptionalLong(
            vtcServicio['@_idservicio'] || vtcServicio.idservicio
        );
        idComunica = parseOptionalLong(
            vtcServicio['@_idcomunica'] || vtcServicio.idcomunica
        );
    }

    const ok = resultado === '00';
    const message = getResultMessage(resultado);

    return {
        ok,
        resultado,
        idServicio,
        idComunica,
        idError,
        message,
        raw: {
            soap: rawXml,
            parsed: parsed as Record<string, unknown>,
        },
    };
}

function parseOptionalLong(value: unknown): number | null {
    if (value === undefined || value === null || value === '') return null;
    const num = Number(value);
    return isNaN(num) ? null : num;
}
