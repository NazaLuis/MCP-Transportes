import { describe, it, expect } from 'vitest';
import { parseResponse } from '../../src/rvtc/soapClient/responseParser.js';

// Helpers to build SOAP response XML fixtures
function buildSoapResponse(bodyXml: string): string {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">',
        '  <soapenv:Body>',
        `    ${bodyXml}`,
        '  </soapenv:Body>',
        '</soapenv:Envelope>',
    ].join('\n');
}

describe('responseParser', () => {
    describe('parseResponse', () => {
        it('should parse success response (resultado=00)', () => {
            const xml = buildSoapResponse(
                `<qaltavtcResponse>
          <body resultado="00">
            <vtcservicio idservicio="12345" idcomunica="67890"/>
          </body>
        </qaltavtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.ok).toBe(true);
            expect(result.resultado).toBe('00');
            expect(result.idServicio).toBe(12345);
            expect(result.idComunica).toBe(67890);
            expect(result.idError).toBeNull();
            expect(result.message).toBe('Operación correcta');
            expect(result.raw.soap).toBe(xml);
        });

        it('should parse error response (resultado!=00)', () => {
            const xml = buildSoapResponse(
                `<qaltavtcResponse>
          <body resultado="51" iderror="999">
            <vtcservicio/>
          </body>
        </qaltavtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.ok).toBe(false);
            expect(result.resultado).toBe('51');
            expect(result.idError).toBe(999);
            expect(result.message).toBe(
                'El NIF que comunica no puede crear servicios para ese intermediario y matrícula'
            );
        });

        it('should parse consulta response', () => {
            const xml = buildSoapResponse(
                `<qconsultavtcResponse>
          <body resultado="00">
            <vtcservicio idservicio="55555" idcomunica="11111"/>
          </body>
        </qconsultavtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.ok).toBe(true);
            expect(result.idServicio).toBe(55555);
            expect(result.idComunica).toBe(11111);
        });

        it('should handle unknown result code gracefully', () => {
            const xml = buildSoapResponse(
                `<qaltavtcResponse>
          <body resultado="99"/>
        </qaltavtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.ok).toBe(false);
            expect(result.resultado).toBe('99');
            expect(result.message).toContain('Error desconocido');
            expect(result.message).toContain('99');
        });

        it('should handle response without vtcservicio node', () => {
            const xml = buildSoapResponse(
                `<qiniciovtcResponse>
          <body resultado="00"/>
        </qiniciovtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.ok).toBe(true);
            expect(result.idServicio).toBeNull();
            expect(result.idComunica).toBeNull();
        });

        it('should throw on malformed XML (no Envelope)', () => {
            expect(() => parseResponse('<not-soap/>')).toThrow(/Envelope/);
        });

        it('should throw on missing Body', () => {
            const xml = [
                '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">',
                '  <soapenv:Header/>',
                '</soapenv:Envelope>',
            ].join('');
            expect(() => parseResponse(xml)).toThrow(/Body/);
        });

        it('should keep raw soap and parsed object in response', () => {
            const xml = buildSoapResponse(
                `<qaltavtcResponse>
          <body resultado="00">
            <vtcservicio idservicio="1"/>
          </body>
        </qaltavtcResponse>`
            );

            const result = parseResponse(xml);
            expect(result.raw.soap).toBe(xml);
            expect(result.raw.parsed).toBeDefined();
            expect(typeof result.raw.parsed).toBe('object');
        });
    });
});
