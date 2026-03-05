/**
 * WS-Security X.509 signer for SOAP messages.
 * 
 * Implements the signing as specified in the RVTC manual:
 * - BinarySecurityToken with public cert in Base64
 * - Signs soapenv:Body referenced by wsu:Id
 * - Exclusive canonicalization (exc-c14n) with InclusiveNamespaces
 * - RSA-SHA1 signature + SHA1 digest
 */

import * as crypto from 'node:crypto';
import { SignedXml } from 'xml-crypto';
import type { CertificateData } from './certs.js';

const WSSE_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd';
const WSU_NS = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
const BASE64_ENCODING = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary';
const X509_VALUE_TYPE = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3';

export interface SignerOptions {
    /** Unique token ID prefix */
    idPrefix?: string;
}

/**
 * Sign a SOAP XML string with WS-Security X.509.
 * 
 * The input XML must have:
 * - soapenv:Body with wsu:Id attribute
 * - soapenv:Header (even if empty)
 * 
 * Returns the signed XML with wsse:Security in the Header.
 */
export function signSoapMessage(
    xml: string,
    certData: CertificateData,
    opts?: SignerOptions
): string {
    const prefix = opts?.idPrefix || generateId();
    const bstId = `X509-${prefix}01`;
    const sigId = `SIG-${prefix}05`;
    const kiId = `KI-${prefix}02`;
    const strId = `STR-${prefix}03`;

    // Extract the wsu:Id from the Body element
    const bodyIdMatch = xml.match(/soapenv:Body[^>]*wsu:Id="([^"]+)"/);
    if (!bodyIdMatch) {
        throw new Error('SOAP Body must have a wsu:Id attribute for signing.');
    }
    const bodyWsuId = bodyIdMatch[1];

    // Create the signer
    const sig = new SignedXml({
        privateKey: certData.privateKey,
        canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
        signatureAlgorithm: 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
        getKeyInfoContent: () => {
            return [
                `<wsse:SecurityTokenReference wsu:Id="${strId}" xmlns:wsu="${WSU_NS}">`,
                `  <wsse:Reference URI="#${bstId}" ValueType="${X509_VALUE_TYPE}"/>`,
                `</wsse:SecurityTokenReference>`,
            ].join('');
        },
    });

    // Add reference to the Body
    sig.addReference({
        xpath: `//*[@wsu:Id='${bodyWsuId}']`,
        digestAlgorithm: 'http://www.w3.org/2000/09/xmldsig#sha1',
        transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
        uri: `#${bodyWsuId}`,
        isEmptyUri: false,
    });


    // Compute the signature (this signs but doesn't place it in the doc)
    sig.computeSignature(xml, {
        prefix: 'ds',
        location: {
            reference: "//*[local-name()='Header']",
            action: 'append',
        },
        existingPrefixes: {
            wsse: WSSE_NS,
            wsu: WSU_NS,
        },
    });

    // Now we need to wrap the signature in the wsse:Security element
    // along with the BinarySecurityToken
    const signatureXml = sig.getSignatureXml();

    // Build the complete wsse:Security block
    const securityBlock = [
        `<wsse:Security xmlns:wsse="${WSSE_NS}" xmlns:wsu="${WSU_NS}">`,
        `  <wsse:BinarySecurityToken`,
        `    EncodingType="${BASE64_ENCODING}"`,
        `    ValueType="${X509_VALUE_TYPE}"`,
        `    wsu:Id="${bstId}">${certData.certBase64}</wsse:BinarySecurityToken>`,
        `  ${signatureXml}`,
        `</wsse:Security>`,
    ].join('\n');

    // Replace the empty Header with one containing the Security block
    const signedXml = xml.replace(
        /<soapenv:Header\/>/,
        `<soapenv:Header>${securityBlock}</soapenv:Header>`
    ).replace(
        /<soapenv:Header><\/soapenv:Header>/,
        `<soapenv:Header>${securityBlock}</soapenv:Header>`
    );

    return signedXml;
}

function generateId(): string {
    return crypto.randomBytes(8).toString('hex').toUpperCase();
}

export { WSSE_NS, WSU_NS };
