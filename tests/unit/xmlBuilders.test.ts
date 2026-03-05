import { describe, it, expect } from 'vitest';
import { buildAltaXml } from '../../src/rvtc/xml/alta.js';
import { buildInicioXml } from '../../src/rvtc/xml/inicio.js';
import { buildAnulacionXml } from '../../src/rvtc/xml/anulacion.js';
import { buildConsultaXml } from '../../src/rvtc/xml/consulta.js';
import { buildModificacionXml } from '../../src/rvtc/xml/modificacion.js';
import { buildHeader, escapeXml } from '../../src/rvtc/xml/builder.js';
import type { AltaInput, ModificacionInput } from '../../src/rvtc/types.js';

const FROZEN_DATE = new Date('2025-06-15T10:30:00.000Z');
const FROZEN_OPTS = { now: FROZEN_DATE };

describe('XML Builders', () => {
    describe('buildHeader', () => {
        it('should produce a deterministic header with frozen clock', () => {
            const header = buildHeader(FROZEN_OPTS);
            expect(header).toBe('<header fecha="2025-06-15T10:30:00" version="1.0" versionsender="1.0"/>');
        });

        it('should use current time if no opts provided', () => {
            const header = buildHeader();
            expect(header).toContain('fecha=');
            expect(header).toContain('version="1.0"');
        });
    });

    describe('escapeXml', () => {
        it('should escape XML special characters', () => {
            expect(escapeXml('a & b')).toBe('a &amp; b');
            expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
            expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
            expect(escapeXml("it's")).toBe('it&apos;s');
        });

        it('should leave normal strings unchanged', () => {
            expect(escapeXml('Calle Falsa 123')).toBe('Calle Falsa 123');
        });
    });

    describe('buildAltaXml', () => {
        const baseInput: AltaInput = {
            matricula: '1234-BBB',
            nifTitular: '99999999R',
            provContratoINE: '28',
            muniContratoINE: '079',
            fContrato: '2025-06-15T09:00:00',
            provInicioINE: '28',
            muniInicioINE: '079',
            direccionInicio: 'Calle Origen 1',
            fPrevistaInicio: '2025-06-15T12:00:00',
            fFin: '2025-06-16',
            veraz: 'S',
        };

        it('should produce valid SOAP envelope with all mandatory fields', () => {
            const xml = buildAltaXml(baseInput, undefined, FROZEN_OPTS);

            expect(xml).toContain('soapenv:Envelope');
            expect(xml).toContain('xmlns:soapenv=');
            expect(xml).toContain('xmlns:vtc=');
            expect(xml).toContain('<vtc:qaltavtc>');
            expect(xml).toContain('</vtc:qaltavtc>');
            expect(xml).toContain('wsu:Id="id-body-1"');
            expect(xml).toContain('matricula="1234-BBB"');
            expect(xml).toContain('niftitular="99999999R"');
            expect(xml).toContain('cgprovcontrato="28"');
            expect(xml).toContain('cgmunicontrato="079"');
            expect(xml).toContain('direccioninicio="Calle Origen 1"');
            expect(xml).toContain('veraz="S"');
        });

        it('should inject nifIntermediario from parameter', () => {
            const xml = buildAltaXml(baseInput, 'B12345678', FROZEN_OPTS);
            expect(xml).toContain('nif="B12345678"');
        });

        it('should prefer input.nifIntermediario over config', () => {
            const input = { ...baseInput, nifIntermediario: 'A11111111' };
            const xml = buildAltaXml(input, 'B12345678', FROZEN_OPTS);
            expect(xml).toContain('nif="A11111111"');
        });

        it('should include optional destination fields when provided', () => {
            const input: AltaInput = {
                ...baseInput,
                provFinINE: '08',
                muniFinINE: '019',
                direccionFin: 'Calle Destino 2',
            };
            const xml = buildAltaXml(input, undefined, FROZEN_OPTS);
            expect(xml).toContain('cgprovfin="08"');
            expect(xml).toContain('cgmunifin="019"');
            expect(xml).toContain('direccionfin="Calle Destino 2"');
        });

        it('should omit optional fields when not provided', () => {
            const xml = buildAltaXml(baseInput, undefined, FROZEN_OPTS);
            expect(xml).not.toContain('cgprovfin');
            expect(xml).not.toContain('cgmunifin');
            expect(xml).not.toContain('direccionfin');
            expect(xml).not.toContain('cgprovlejano');
        });

        it('should include punto lejano fields when provided', () => {
            const input: AltaInput = {
                ...baseInput,
                provLejanoINE: '46',
                muniLejanoINE: '250',
                direccionLejano: 'Lugar Lejano',
            };
            const xml = buildAltaXml(input, undefined, FROZEN_OPTS);
            expect(xml).toContain('cgprovlejano="46"');
            expect(xml).toContain('cgmunilejano="250"');
            expect(xml).toContain('direccionlejano="Lugar Lejano"');
        });

        it('should include frozen timestamp in header', () => {
            const xml = buildAltaXml(baseInput, undefined, FROZEN_OPTS);
            expect(xml).toContain('fecha="2025-06-15T10:30:00"');
        });
    });

    describe('buildInicioXml', () => {
        it('should produce correct qiniciovtc structure', () => {
            const xml = buildInicioXml(12345, FROZEN_OPTS);

            expect(xml).toContain('soapenv:Envelope');
            expect(xml).toContain('<vtc:qiniciovtc>');
            expect(xml).toContain('<vtcservicio>');
            expect(xml).toContain('<idservicio>12345</idservicio>');
            expect(xml).toContain('</vtcservicio>');
            expect(xml).toContain('wsu:Id="id-body-1"');
        });
    });

    describe('buildAnulacionXml', () => {
        it('should produce correct qanulacionvtc structure', () => {
            const xml = buildAnulacionXml(67890, FROZEN_OPTS);

            expect(xml).toContain('<vtc:qanulacionvtc>');
            expect(xml).toContain('<vtcservicio>');
            expect(xml).toContain('<idservicio>67890</idservicio>');
        });
    });

    describe('buildConsultaXml', () => {
        it('should produce correct qconsultavtc structure with vtcconsulta', () => {
            const xml = buildConsultaXml(11111, FROZEN_OPTS);

            expect(xml).toContain('<vtc:qconsultavtc>');
            expect(xml).toContain('<vtcconsulta>');
            expect(xml).toContain('<idservicio>11111</idservicio>');
            expect(xml).toContain('</vtcconsulta>');
        });
    });

    describe('buildModificacionXml', () => {
        it('should include idServicio and only provided optional fields', () => {
            const input: ModificacionInput = {
                idServicio: 99999,
                provFinINE: '28',
                muniFinINE: '079',
                direccionFin: 'Nuevo Destino',
            };
            const xml = buildModificacionXml(input, FROZEN_OPTS);

            expect(xml).toContain('<vtc:qmodificacionvtc>');
            expect(xml).toContain('<idservicio>99999</idservicio>');
            expect(xml).toContain('<cgprovfin>28</cgprovfin>');
            expect(xml).toContain('<cgmunifin>079</cgmunifin>');
            expect(xml).toContain('<direccionfin>Nuevo Destino</direccionfin>');
            // Not provided
            expect(xml).not.toContain('cgprovlejano');
            expect(xml).not.toContain('matricula');
        });

        it('should include matricula when provided', () => {
            const input: ModificacionInput = {
                idServicio: 88888,
                matricula: '5678-CCC',
            };
            const xml = buildModificacionXml(input, FROZEN_OPTS);
            expect(xml).toContain('<matricula>5678-CCC</matricula>');
        });

        it('should include punto lejano fields when provided', () => {
            const input: ModificacionInput = {
                idServicio: 77777,
                provLejanoINE: '46',
                muniLejanoINE: '250',
                direccionLejano: 'Lejano Mod',
            };
            const xml = buildModificacionXml(input, FROZEN_OPTS);
            expect(xml).toContain('<cgprovlejano>46</cgprovlejano>');
            expect(xml).toContain('<cgmunilejano>250</cgmunilejano>');
            expect(xml).toContain('<direccionlejano>Lejano Mod</direccionlejano>');
        });
    });
});
