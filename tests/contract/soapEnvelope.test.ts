import { describe, it, expect, beforeAll } from 'vitest';
import * as forge from 'node-forge';
import { signSoapMessage } from '../../src/rvtc/wsse/signer.js';
import { buildAltaXml } from '../../src/rvtc/xml/alta.js';
import type { CertificateData } from '../../src/rvtc/wsse/certs.js';
import type { AltaInput } from '../../src/rvtc/types.js';

/**
 * Contract tests: verify the SOAP+WSSE envelope structure
 * that the RVTC endpoint expects.
 *
 * Uses a self-signed test certificate so no real cert is needed.
 */

let testCertData: CertificateData;

beforeAll(() => {
    // Generate a self-signed RSA certificate for testing
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    const attrs = [{ name: 'commonName', value: 'MCP-RVTC Test' }];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.sign(keys.privateKey);

    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    testCertData = {
        certificate: certPem,
        privateKey: keyPem,
        certBase64,
    };
});

function buildTestEnvelope(): string {
    const input: AltaInput = {
        matricula: '1234-BBB',
        nifTitular: '99999999R',
        provContratoINE: '28',
        muniContratoINE: '079',
        fContrato: '2025-06-15T09:00:00',
        provInicioINE: '28',
        muniInicioINE: '079',
        direccionInicio: 'Test Address',
        fPrevistaInicio: '2025-06-15T12:00:00',
        fFin: '2025-06-16',
        veraz: 'S',
    };
    return buildAltaXml(input, 'B12345678', { now: new Date('2025-06-15T10:30:00Z') });
}

describe('SOAP + WSSE Envelope Contract', () => {
    it('should produce a valid signed SOAP envelope', () => {
        const unsignedXml = buildTestEnvelope();
        const signedXml = signSoapMessage(unsignedXml, testCertData, {
            idPrefix: 'TEST',
        });

        // Basic SOAP structure
        expect(signedXml).toContain('soapenv:Envelope');
        expect(signedXml).toContain('soapenv:Header');
        expect(signedXml).toContain('soapenv:Body');
    });

    it('should contain wsse:Security in the Header', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });
        expect(signedXml).toContain('wsse:Security');
        expect(signedXml).toContain('xmlns:wsse=');
    });

    it('should contain BinarySecurityToken with non-empty Base64', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain('wsse:BinarySecurityToken');
        expect(signedXml).toContain('wsu:Id="X509-TEST01"');

        // Check BST has content (Base64 encoded cert)
        const bstMatch = signedXml.match(
            /BinarySecurityToken[^>]*>([^<]+)<\/wsse:BinarySecurityToken/
        );
        expect(bstMatch).not.toBeNull();
        expect(bstMatch![1].length).toBeGreaterThan(10);
    });

    it('should contain ds:Signature element', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain('ds:Signature');
        expect(signedXml).toContain('ds:SignedInfo');
        expect(signedXml).toContain('ds:SignatureValue');
        expect(signedXml).toContain('ds:Reference');
    });

    it('should reference Body by wsu:Id in the signature', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        // The Body has wsu:Id="id-body-1" (set by buildSoapEnvelope)
        expect(signedXml).toContain('URI="#id-body-1"');
    });

    it('should use exclusive canonicalization (exc-c14n)', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain(
            'http://www.w3.org/2001/10/xml-exc-c14n#'
        );
    });

    it('should use RSA-SHA1 signature algorithm', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain(
            'http://www.w3.org/2000/09/xmldsig#rsa-sha1'
        );
    });

    it('should use SHA1 digest algorithm', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain(
            'http://www.w3.org/2000/09/xmldsig#sha1'
        );
    });

    it('should contain SecurityTokenReference pointing to BST', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain('wsse:SecurityTokenReference');
        expect(signedXml).toContain('URI="#X509-TEST01"');
    });

    it('should have correct SOAP 1.1 namespace', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).toContain(
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"'
        );
    });

    it('should not contain the empty Header anymore', () => {
        const signedXml = signSoapMessage(buildTestEnvelope(), testCertData, {
            idPrefix: 'TEST',
        });

        expect(signedXml).not.toContain('<soapenv:Header/>');
        expect(signedXml).not.toContain('<soapenv:Header></soapenv:Header>');
    });
});
