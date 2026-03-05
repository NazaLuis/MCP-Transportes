/** MCP tool: rvtc.get_service → ConsultaDeServicio */

import { z } from 'zod';
import type { SoapClient } from '../../rvtc/soapClient/client.js';
import { validateIdServicio } from '../../rvtc/validators/index.js';
import { buildConsultaXml } from '../../rvtc/xml/consulta.js';
import type { RvtcResponse } from '../../rvtc/types.js';

export const getServiceSchema = z.object({
    idServicio: z.number().int().describe('Identificador del servicio a consultar'),
});

export type GetServiceInput = z.infer<typeof getServiceSchema>;

export async function handleGetService(
    input: GetServiceInput,
    client: SoapClient,
): Promise<RvtcResponse> {
    try {
        const id = validateIdServicio(input.idServicio);
        const xml = buildConsultaXml(id);
        return await client.send('ConsultaDeServicio', xml);
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
