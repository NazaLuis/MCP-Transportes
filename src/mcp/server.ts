/**
 * MCP Server setup: registers all RVTC tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import type { Config } from '../config.js';
import { SoapClient } from '../rvtc/soapClient/client.js';
import { loadCertificate, type CertificateData } from '../rvtc/wsse/certs.js';
import { createCorrelationId, createChildLogger, logger } from '../logger.js';
import type { RvtcResponse } from '../rvtc/types.js';

import {
    createServiceSchema,
    handleCreateService,
} from './tools/createService.js';
import {
    startServiceSchema,
    handleStartService,
} from './tools/startService.js';
import {
    cancelServiceSchema,
    handleCancelService,
} from './tools/cancelService.js';
import {
    modifyServiceSchema,
    handleModifyService,
} from './tools/modifyService.js';
import {
    getServiceSchema,
    handleGetService,
} from './tools/getService.js';

export async function createMcpServer(config: Config): Promise<void> {
    // Load certificate
    let certData: CertificateData;
    try {
        certData = loadCertificate(config.cert);
        logger.info('Certificate loaded successfully');
    } catch (err) {
        logger.error({ error: (err as Error).message }, 'Failed to load certificate');
        throw err;
    }

    const server = new McpServer({
        name: 'mcp-rvtc',
        version: '1.0.0',
    });

    // Helper: wraps a tool handler with correlation ID, logging, and error handling
    function wrapHandler<T>(
        toolName: string,
        handler: (input: T, client: SoapClient, config: Config) => Promise<RvtcResponse>,
    ) {
        return async (input: T) => {
            const correlationId = createCorrelationId();
            const childLogger = createChildLogger(correlationId);
            childLogger.info({ tool: toolName }, 'Tool invoked');

            const client = new SoapClient({
                config,
                certData,
                logger: childLogger,
            });

            try {
                const result = await handler(input, client, config);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                };
            } catch (err) {
                const error = err as Error;
                childLogger.error({ tool: toolName, error: error.message }, 'Tool error');

                const errorResponse: RvtcResponse = {
                    ok: false,
                    resultado: 'ERROR',
                    idServicio: null,
                    idComunica: null,
                    idError: null,
                    message: error.message,
                    raw: { soap: '', parsed: {} },
                };

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: JSON.stringify(errorResponse, null, 2),
                        },
                    ],
                    isError: true,
                };
            }
        };
    }

    // Register tools
    server.tool(
        'rvtc.create_service',
        'Comunicación de un servicio VTC al RVTC (AltaDeServicio). Registra un nuevo servicio de arrendamiento de vehículo con conductor.',
        createServiceSchema.shape,
        wrapHandler('rvtc.create_service', handleCreateService),
    );

    server.tool(
        'rvtc.start_service',
        'Inicio de un servicio VTC previamente comunicado (InicioDeServicio). Marca el momento de inicio real del servicio con el pasajero.',
        startServiceSchema.shape,
        wrapHandler('rvtc.start_service', (input, client) => handleStartService(input, client)),
    );

    server.tool(
        'rvtc.cancel_service',
        'Anulación de un servicio VTC (AnulacionDeServicio). Cancela un servicio previamente comunicado que no ha sido iniciado.',
        cancelServiceSchema.shape,
        wrapHandler('rvtc.cancel_service', (input, client) => handleCancelService(input, client)),
    );

    server.tool(
        'rvtc.modify_service',
        'Modificación de un servicio VTC (ModificacionDeServicio). Permite cambiar destino, punto lejano o matrícula de un servicio.',
        modifyServiceSchema.shape,
        wrapHandler('rvtc.modify_service', (input, client) => handleModifyService(input, client)),
    );

    server.tool(
        'rvtc.get_service',
        'Consulta de un servicio VTC (ConsultaDeServicio). Obtiene los datos registrados de un servicio por su identificador.',
        getServiceSchema.shape,
        wrapHandler('rvtc.get_service', (input, client) => handleGetService(input, client)),
    );

    // Connect via stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info({ env: config.env, endpoint: config.wsdlUrl }, 'MCP RVTC server started');
}
