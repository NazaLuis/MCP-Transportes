/** MCP tool: rvtc.modify_service → ModificacionDeServicio */

import { z } from 'zod';
import type { SoapClient } from '../../rvtc/soapClient/client.js';
import { validateModificacionInput } from '../../rvtc/validators/index.js';
import { buildModificacionXml } from '../../rvtc/xml/modificacion.js';
import type { ModificacionInput, RvtcResponse } from '../../rvtc/types.js';

export const modifyServiceSchema = z.object({
    idServicio: z.number().int().describe('Identificador del servicio a modificar'),
    provFinINE: z.string().optional().describe('Nuevo código INE provincia destino'),
    muniFinINE: z.string().optional().describe('Nuevo código INE municipio destino'),
    direccionFin: z.string().optional().describe('Nueva dirección destino'),
    provLejanoINE: z.string().optional().describe('Nuevo código INE provincia punto lejano'),
    muniLejanoINE: z.string().optional().describe('Nuevo código INE municipio punto lejano'),
    direccionLejano: z.string().optional().describe('Nueva dirección punto lejano'),
    matricula: z.string().optional().describe('Nueva matrícula (solo si estado lo permite)'),
});

export type ModifyServiceInput = z.infer<typeof modifyServiceSchema>;

export async function handleModifyService(
    input: ModifyServiceInput,
    client: SoapClient,
): Promise<RvtcResponse> {
    try {
        const validated = validateModificacionInput(input as ModificacionInput);
        const xml = buildModificacionXml(validated);
        return await client.send('ModificacionDeServicio', xml);
    } catch (err) {
        return {
            ok: false,
            resultado: 'VAL-ERR',
            idServicio: input.idServicio,
            idComunica: null,
            idError: null,
            message: (err as Error).message,
            raw: { soap: '', parsed: {} },
        };
    }
}
