/** MCP tool: rvtc.create_service → AltaDeServicio */

import { z } from 'zod';
import type { SoapClient } from '../../rvtc/soapClient/client.js';
import type { Config } from '../../config.js';
import { validateAltaInput, type ValidationContext } from '../../rvtc/validators/index.js';
import { buildAltaXml } from '../../rvtc/xml/alta.js';
import type { AltaInput, RvtcResponse } from '../../rvtc/types.js';

export const createServiceSchema = z.object({
    matricula: z.string().describe('Matrícula del vehículo (formato NNNN-LLL)'),
    nifTitular: z.string().describe('NIF del titular de la autorización (9 chars)'),
    nifIntermediario: z.string().optional().describe('NIF del intermediario (obligatorio en integración)'),
    provContratoINE: z.string().describe('Código INE provincia del contrato (2 dígitos)'),
    muniContratoINE: z.string().describe('Código INE municipio del contrato (3 dígitos)'),
    fContrato: z.string().describe('Fecha del contrato (YYYY-MM-DDThh:mm:ss)'),
    provInicioINE: z.string().describe('Código INE provincia origen (2 dígitos)'),
    muniInicioINE: z.string().describe('Código INE municipio origen (3 dígitos)'),
    direccionInicio: z.string().describe('Dirección origen (max 100 chars)'),
    fPrevistaInicio: z.string().describe('Fecha/hora prevista inicio (YYYY-MM-DDThh:mm:ss)'),
    fFin: z.string().describe('Fecha fin del servicio (YYYY-MM-DD)'),
    provFinINE: z.string().optional().describe('Código INE provincia destino'),
    muniFinINE: z.string().optional().describe('Código INE municipio destino'),
    direccionFin: z.string().optional().describe('Dirección destino (max 100 chars)'),
    provLejanoINE: z.string().optional().describe('Código INE provincia punto más lejano'),
    muniLejanoINE: z.string().optional().describe('Código INE municipio punto más lejano'),
    direccionLejano: z.string().optional().describe('Dirección punto más lejano (max 100 chars)'),
    veraz: z.enum(['S', 'N']).describe('Veracidad de datos (S/N)'),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;

export async function handleCreateService(
    input: CreateServiceInput,
    client: SoapClient,
    config: Config,
): Promise<RvtcResponse> {
    const ctx: ValidationContext = {
        env: config.env,
        intermediarioNif: config.intermediarioNif,
    };

    try {
        const validated = validateAltaInput(input as AltaInput, ctx);
        const xml = buildAltaXml(validated, config.intermediarioNif);
        return await client.send('AltaDeServicio', xml);
    } catch (err) {
        return {
            ok: false,
            resultado: 'VAL-ERR',
            idServicio: null,
            idComunica: null,
            idError: null,
            message: (err as Error).message,
            raw: { soap: '', parsed: {} },
        };
    }
}
