/** MCP tool: rvtc.start_service → InicioDeServicio */

import { z } from 'zod';
import type { SoapClient } from '../../rvtc/soapClient/client.js';
import { validateIdServicio } from '../../rvtc/validators/index.js';
import { buildInicioXml } from '../../rvtc/xml/inicio.js';
import type { RvtcResponse } from '../../rvtc/types.js';

export const startServiceSchema = z.object({
    idServicio: z.number().int().describe('Identificador del servicio a iniciar'),
});

export type StartServiceInput = z.infer<typeof startServiceSchema>;

export async function handleStartService(
    input: StartServiceInput,
    client: SoapClient,
): Promise<RvtcResponse> {
    const id = validateIdServicio(input.idServicio);
    const xml = buildInicioXml(id);
    return client.send('InicioDeServicio', xml);
}
