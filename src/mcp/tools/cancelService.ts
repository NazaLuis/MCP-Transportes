/** MCP tool: rvtc.cancel_service → AnulacionDeServicio */

import { z } from 'zod';
import type { SoapClient } from '../../rvtc/soapClient/client.js';
import { validateIdServicio } from '../../rvtc/validators/index.js';
import { buildAnulacionXml } from '../../rvtc/xml/anulacion.js';
import type { RvtcResponse } from '../../rvtc/types.js';

export const cancelServiceSchema = z.object({
    idServicio: z.number().int().describe('Identificador del servicio a anular'),
});

export type CancelServiceInput = z.infer<typeof cancelServiceSchema>;

export async function handleCancelService(
    input: CancelServiceInput,
    client: SoapClient,
): Promise<RvtcResponse> {
    const id = validateIdServicio(input.idServicio);
    const xml = buildAnulacionXml(id);
    return client.send('AnulacionDeServicio', xml);
}
