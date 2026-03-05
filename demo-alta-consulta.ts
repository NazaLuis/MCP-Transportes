import { createSoapClient } from './src/rvtc/soapClient/client.js';
import { handleCreateService } from './src/mcp/tools/createService.js';
import { handleGetService } from './src/mcp/tools/getService.js';

async function runDemo() {
    console.log('🚀 Iniciando demostración RVTC...');
    console.log('Entorno:', process.env.RVTC_ENV);

    // 1. Inicializar cliente SOAP
    const client = createSoapClient();

    // 2. Datos de prueba para el Alta
    const fContrato = new Date().toISOString();
    // Inicio: 1 hora a partir de ahora, Fin: Mañana
    const fPrevistaInicio = new Date(Date.now() + 3600000).toISOString();
    const fFin = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const altaData = {
        matricula: '1234-DEM',
        nifTitular: 'B12345678',
        provContratoINE: '28',
        muniContratoINE: '079',
        fContrato: fContrato,
        provInicioINE: '28',
        muniInicioINE: '079',
        direccionInicio: 'Calle de Prueba 123, Madrid',
        fPrevistaInicio: fPrevistaInicio,
        fFin: fFin,
        veraz: 'S' as const
    };

    console.log('\n=========================================');
    console.log('📝 ENVIANDO ALTA DE SERVICIO');
    console.log(JSON.stringify(altaData, null, 2));

    // @ts-ignore
    const altaResult = await handleCreateService(altaData, client);

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

    // 3. Consultar el servicio recién creado
    const consultaResult = await handleGetService({ idServicio: altaResult.idServicio }, client);

    console.log('\n✅ RESULTADO CONSULTA:');
    console.log(`OK: ${consultaResult.ok}`);
    console.log(`Resultado Código: ${consultaResult.resultado}`);
    console.log(`Mensaje: ${consultaResult.message}`);

    // 4. Mostrar los datos extraídos por el parser desde el RAW XML
    if (consultaResult.raw && consultaResult.raw.parsed) {
        try {
            const parsed = consultaResult.raw.parsed;

            // Navegar para extraer todos los atributos del servicio (Fast XML Parser mapea atributos con @_)
            const envelope = parsed.Envelope || parsed['soapenv:Envelope'] || parsed['soap:Envelope'];
            const body = envelope.Body || envelope['soapenv:Body'] || envelope['soap:Body'];

            // El atributo de respuesta es rconsultavtc
            let serviceData = null;

            for (const key of Object.keys(body)) {
                if (key.includes('rconsultavtc')) {
                    const responseBody = body[key]?.body || body[key]?.['vtc:body'];
                    if (responseBody) {
                        serviceData = responseBody['vtcservicio'] || responseBody['vtc:vtcservicio'];
                    }
                    break;
                }
            }

            if (serviceData) {
                console.log('\n📄 DATOS DEL SERVICIO OBTENIDOS DEL MITMA:');

                // Formatear la salida para que sea legible sin los prefijos @_
                const formattedData: Record<string, string> = {};
                for (const [key, value] of Object.entries(serviceData)) {
                    if (key.startsWith('@_')) {
                        formattedData[key.substring(2)] = String(value);
                    } else {
                        formattedData[key] = String(value);
                    }
                }

                console.log(JSON.stringify(formattedData, null, 2));
            } else {
                console.log('\n⚠️ No se encontraron atributos de servicio en la respuesta XML.');
            }
        } catch (err) {
            console.log('No se pudieron extraer los atributos debido a un error de parseo.', err);
        }
    }
}

runDemo().catch(console.error);
