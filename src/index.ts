#!/usr/bin/env node
/**
 * MCP-RVTC Server Entry Point
 *
 * Starts the MCP server for RVTC (Registro de Comunicaciones de Servicios VTC)
 * integration with MITMA via SOAP 1.1 + WS-Security X.509.
 */

import { config as dotenvConfig } from 'dotenv';
import { loadConfig } from './config.js';
import { createMcpServer } from './mcp/server.js';
import { logger } from './logger.js';

// Load environment variables from .env if present
dotenvConfig();

async function main() {
    try {
        const config = loadConfig();
        await createMcpServer(config);
    } catch (err) {
        const error = err as Error;
        logger.fatal({ error: error.message }, 'Failed to start MCP-RVTC server');
        process.exit(1);
    }
}

main();
