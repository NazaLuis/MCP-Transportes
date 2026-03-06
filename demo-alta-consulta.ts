import { loadConfig } from './src/config.js';
import { SoapClient } from './src/rvtc/soapClient/client.js';
import { loadCertificate } from './src/rvtc/wsse/certs.js';
import { logger } from './src/logger.js';
import { handleCreateService } from './src/mcp/tools/createService.js';
import { handleGetService } from './src/mcp/tools/getService.js';

async function runDemo() {
    console.log('🚀 Iniciando demostración RVTC...');

    // 1. Cargar configuración y certificado (usa variables de entorno ya cargadas)
    const rvtcConfig = loadConfig();
    console.log('Entorno:', rvtcConfig.env);
    console.log('Endpoint:', rvtcConfig.wsdlUrl);

    const certData = loadCertificate(rvtcConfig.cert);

    // 2. Inicializar cliente SOAP directamente como hace el servidor MCP
    const client = new SoapClient({
        config: rvtcConfig,
        certData,
        logger
    });

    // 3. Datos de prueba para el Alta
    const formatDate = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, '');
    const formatDay = (date: Date) => date.toISOString().slice(0, 10);

    const fContrato = formatDate(new Date(Date.now() + 7200000)); // +2 horas
    const fPrevistaInicio = formatDate(new Date(Date.now() + 86400000)); // +1 día
    const fFin = formatDay(new Date(Date.now() + 172800000)); // +2 días (para que sea posterior al inicio)

    const altaData = {
        matricula: '9890-GCF',
        nifTitular: '99999999R',
        provContratoINE: '28',
        muniContratoINE: '079',
        fContrato: fContrato,
        provInicioINE: '28',
        muniInicioINE: '079',
        direccionInicio: 'Calle de Hernán Cortés 9, Madrid 28004',
        fPrevistaInicio: fPrevistaInicio,
        fFin: fFin,
        // Añadimos destino opcional para que aparezca en la consulta
        provFinINE: '28',
        muniFinINE: '079',
        direccionFin: 'Calle Jaime Hermida, 8, Madrid, España',
        // Si origen y destino son iguales (mismo municipio), el punto lejano es obligatorio
        //provLejanoINE: '28',
        //muniLejanoINE: '079', // Alcala de Henares (como punto lejano)
        //direccionLejano: '',
        veraz: 'S' as const
    };

    console.log('\n=========================================');
    console.log('📝 ENVIANDO ALTA DE SERVICIO');
    console.log(JSON.stringify(altaData, null, 2));

    // @ts-ignore - handleCreateService espera el tipo exacto de Zod
    const altaResult = await handleCreateService(altaData, client, rvtcConfig);

    console.log('\n✅ RESULTADO ALTA:');
    console.log(`OK: ${altaResult.ok}`);
    console.log(`Resultado Código: ${altaResult.resultado}`);
    console.log(`Mensaje: ${altaResult.message}`);
    console.log(`ID Servicio Generado: ${altaResult.idServicio}`);

    if (!altaResult.ok || !altaResult.idServicio) {
        console.error('❌ Falló el alta, la prueba se detiene aquí.');
        return;
    }

    console.log('\n=========================================');
    console.log(`🔍 ENVIANDO CONSULTA PARA EL SERVICIO CON ID: ${altaResult.idServicio}`);

    // 4. Consultar el servicio recién creado
    const consultaResult = await handleGetService({ idServicio: altaResult.idServicio }, client);

    console.log('\n✅ RESULTADO CONSULTA:');
    console.log(`OK: ${consultaResult.ok}`);
    console.log(`Resultado Código: ${consultaResult.resultado}`);
    console.log(`Mensaje: ${consultaResult.message}`);

    // 5. Mostrar los datos extraídos por el parser
    if (consultaResult.raw && consultaResult.raw.parsed) {
        try {
            const parsed = consultaResult.raw.parsed as any;

            const envelope = parsed.Envelope || parsed['soapenv:Envelope'] || parsed['soap:Envelope'];
            const body = envelope.Body || envelope['soapenv:Body'] || envelope['soap:Body'];

            let serviceData = null;
            for (const key of Object.keys(body)) {
                if (key.toLowerCase().includes('consultavtc')) {
                    const responseBody = body[key]?.body || body[key]?.['vtc:body'];
                    if (responseBody) {
                        serviceData = responseBody['vtcservicio'] || responseBody['vtc:vtcservicio'];
                    }
                    break;
                }
            }

            if (serviceData) {
                console.log('\n📄 DATOS DEL SERVICIO OBTENIDOS DEL MITMA:');
                const formattedData: Record<string, string> = {};
                for (const [key, value] of Object.entries(serviceData)) {
                    const cleanKey = key.startsWith('@_') ? key.substring(2) : key;
                    formattedData[cleanKey] = String(value);
                }
                console.log(JSON.stringify(formattedData, null, 2));
            } else {
                console.log('\n⚠️ No se encontraron detalles adicionales del servicio en la respuesta.');
            }
        } catch (err) {
            console.log('No se pudieron extraer los atributos debido a un error de parseo.', err);
        }
    }
}

runDemo().catch(console.error);
