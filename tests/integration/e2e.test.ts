import { describe, it, expect, beforeAll } from 'vitest';
import { SoapClient } from '../../src/rvtc/soapClient/client.js';
import { loadConfig } from '../../src/config.js';
import { loadCertificate } from '../../src/rvtc/wsse/certs.js';
import { logger } from '../../src/logger.js';
import { handleCreateService } from '../../src/mcp/tools/createService.js';
import { handleStartService } from '../../src/mcp/tools/startService.js';
import { handleCancelService } from '../../src/mcp/tools/cancelService.js';
import { handleModifyService } from '../../src/mcp/tools/modifyService.js';
import { handleGetService } from '../../src/mcp/tools/getService.js';

/**
 * Integration tests — E2E against the real RVTC endpoint.
 *
 * Gated by RVTC_RUN_INTEGRATION_TESTS=true.
 * Requires valid certificate config (P12 or PEM) and RVTC_INTERMEDIARIO_NIF.
 */

const SKIP = !process.env.RVTC_RUN_INTEGRATION_TESTS;

describe.skipIf(SKIP)('RVTC E2E Integration', () => {
    let client: SoapClient;
    let config: ReturnType<typeof loadConfig>;

    // Test data from the user
    const NIF_TITULAR = '99999999R';
    const TEST_VEHICLES = ['9890-GCF', '9999-ZZZ', '9436-FYS', '9436-DHB'];

    beforeAll(() => {
        config = loadConfig();
        const certData = loadCertificate(config.cert);
        client = new SoapClient({
            config,
            certData,
            logger: logger.child({ module: 'e2e-test' }),
        });
    });

    const getTomorrowISO = () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(12, 0, 0, 0);
        return d.toISOString().replace(/\.\d{3}Z$/, '');
    };

    const getDayAfterTomorrowDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    };

    it('Alta → Consulta → Anulación (matrícula 9890-GCF)', async () => {
        const matricula = '9890-GCF';

        // 1. ALTA
        const altaResult = await handleCreateService({
            matricula,
            nifTitular: NIF_TITULAR,
            provContratoINE: '28',
            muniContratoINE: '079', // Madrid
            fContrato: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
            provInicioINE: '28',
            muniInicioINE: '079',
            direccionInicio: 'Paseo de la Castellana 1, Madrid',
            fPrevistaInicio: getTomorrowISO(),
            fFin: getDayAfterTomorrowDate(),
            veraz: 'S'
        }, client, config);

        expect(altaResult.ok).toBe(true);
        expect(altaResult.idServicio).toBeDefined();

        const idServicio = altaResult.idServicio!;

        // 2. CONSULTA ANTES DE INICIO
        const consultaResult = await handleGetService({ idServicio }, client);
        expect(consultaResult.ok).toBe(true);
        expect(consultaResult.idServicio).toBe(idServicio);

        // 3. INICIO
        const startResult = await handleStartService({ idServicio }, client);
        expect(startResult.ok).toBe(true);

        // 4. ANULACION (FALLARÁ PORQUE YA ESTÁ INICIADO, PERO LO INTENTAMOS Y LUEGO HACEMOS OTRA COSA SI QUEREMOS LIMPIAR, O DEJAMOS EL SERVICIO VIVO AL HABER ENTRADO EN INICIO)
        // Como no se puede anular un servicio iniciado (según reglas RVTC), no verificamos expect(ok=true).
        await handleCancelService({ idServicio }, client);
    });

    it('Alta → Modificación → Anulación (matrícula 9999-ZZZ)', async () => {
        const matricula = '9999-ZZZ';

        // 1. ALTA
        const altaResult = await handleCreateService({
            matricula,
            nifTitular: NIF_TITULAR,
            provContratoINE: '08', // Barcelona
            muniContratoINE: '019',
            fContrato: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
            provInicioINE: '08',
            muniInicioINE: '019',
            direccionInicio: 'Plaça Catalunya 1, Barcelona',
            fPrevistaInicio: getTomorrowISO(),
            fFin: getDayAfterTomorrowDate(),
            veraz: 'S'
        }, client, config);

        expect(altaResult.ok).toBe(true);
        const idServicio = altaResult.idServicio!;

        // 2. MODIFICACION (Añadir destino)
        const modificacionResult = await handleModifyService({
            idServicio,
            provFinINE: '08',
            muniFinINE: '019',
            direccionFin: 'Camp Nou, Barcelona'
        }, client);
        expect(modificacionResult.ok).toBe(true);

        // 3. ANULACION (limpieza)
        const anulacionResult = await handleCancelService({ idServicio }, client);
        expect(anulacionResult.ok).toBe(true);
    });

    it('Flujo fallido: NIF titular incorrecto', async () => {
        const altaResult = await handleCreateService({
            matricula: '9436-FYS',
            nifTitular: '11111111H', // Falso
            provContratoINE: '28',
            muniContratoINE: '079',
            fContrato: new Date().toISOString().replace(/\.\d{3}Z$/, ''),
            provInicioINE: '28',
            muniInicioINE: '079',
            direccionInicio: 'Test',
            fPrevistaInicio: getTomorrowISO(),
            fFin: getDayAfterTomorrowDate(),
            veraz: 'S'
        }, client, config);

        // Debe fallar porque el entorno integración exige el titular oficial
        expect(altaResult.ok).toBe(false);
    });
});
