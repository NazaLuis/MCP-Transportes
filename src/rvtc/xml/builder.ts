/** Common XML builder: SOAP envelope, header, body wrappers */

import type { AltaInput } from '../types.js';

const SOAP_NS = 'http://schemas.xmlsoap.org/soap/envelope/';
const VTC_NS = 'http://mfom.com/vtc';

export interface XmlBuilderOptions {
    /** Override timestamp for deterministic tests */
    now?: Date;
}

function formatTimestamp(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, '');
}

/**
 * Build the header element: <header fecha="..." version="1.0" versionsender="1.0"/>
 */
export function buildHeader(opts?: XmlBuilderOptions): string {
    const ts = formatTimestamp(opts?.now || new Date());
    return `<header fecha="${ts}" version="1.0" versionsender="1.0"/>`;
}

/**
 * Wrap payload in SOAP 1.1 envelope with vtc namespace.
 * The Body gets a wsu:Id attribute for WS-Security signing.
 */
export function buildSoapEnvelope(
    operationTag: string,
    bodyContent: string,
    bodyWsuId: string = 'id-body-1'
): string {
    return [
        `<soapenv:Envelope xmlns:soapenv="${SOAP_NS}" xmlns:vtc="${VTC_NS}">`,
        `  <soapenv:Header/>`,
        `  <soapenv:Body wsu:Id="${bodyWsuId}" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">`,
        `    <vtc:${operationTag}>`,
        bodyContent,
        `    </vtc:${operationTag}>`,
        `  </soapenv:Body>`,
        `</soapenv:Envelope>`,
    ].join('\n');
}

/** Escape XML special characters */
export function escapeXml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export { SOAP_NS, VTC_NS, formatTimestamp };
