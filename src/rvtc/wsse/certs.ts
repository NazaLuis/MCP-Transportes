/** Certificate loading: P12 and PEM support */

import * as fs from 'node:fs';
import pkgForge from 'node-forge';

// Handle ESM/CJS interop for node-forge
const forge = (pkgForge as any).default || pkgForge;

export interface CertificateData {
    /** PEM-encoded certificate (public) */
    certificate: string;
    /** PEM-encoded private key */
    privateKey: string;
    /** DER certificate in Base64 (for BinarySecurityToken) */
    certBase64: string;
}

export function loadP12(path: string, password: string): CertificateData {
    const p12Buffer = fs.readFileSync(path);
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer.toString('binary')));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Extract certificate
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0 || !certBag[0].cert) {
        throw new Error('No certificate found in P12 file.');
    }
    const cert = certBag[0].cert;

    // Extract private key
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
        throw new Error('No private key found in P12 file.');
    }
    const key = keyBag[0].key;

    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(key);

    // DER → Base64 for BinarySecurityToken
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    return { certificate: certPem, privateKey: keyPem, certBase64 };
}

export function loadPem(
    certPath: string,
    keyPath: string,
    keyPassword?: string
): CertificateData {
    const certPem = fs.readFileSync(certPath, 'utf-8');
    let keyPem = fs.readFileSync(keyPath, 'utf-8');

    // If key is encrypted, decrypt it
    if (keyPassword && keyPem.includes('ENCRYPTED')) {
        const encryptedKey = forge.pki.decryptRsaPrivateKey(keyPem, keyPassword);
        if (!encryptedKey) {
            throw new Error('Failed to decrypt private key. Check password.');
        }
        keyPem = forge.pki.privateKeyToPem(encryptedKey);
    }

    // Extract Base64 DER from PEM cert
    const cert = forge.pki.certificateFromPem(certPem);
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const certBase64 = forge.util.encode64(certDer);

    return { certificate: certPem, privateKey: keyPem, certBase64 };
}

export function loadCertificate(config: {
    type: 'p12' | 'pem';
    path?: string;
    password?: string;
    certPath?: string;
    keyPath?: string;
    keyPassword?: string;
}): CertificateData {
    if (config.type === 'p12') {
        return loadP12(config.path!, config.password || '');
    } else {
        return loadPem(config.certPath!, config.keyPath!, config.keyPassword);
    }
}
