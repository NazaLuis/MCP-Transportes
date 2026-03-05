# MCP-RVTC Server

Servidor MCP (Model Context Protocol) para la integración con el **Registro de Comunicaciones de Servicios VTC (RVTC)** del Ministerio de Transportes y Movilidad Sostenible (MITMA), mediante SOAP 1.1 y firmas WS-Security X.509.

Este servidor expone herramientas para que clientes MCP (como Claude, Cursor, o agentes desarrollados a medida) puedan comunicarse en lenguaje natural con el backend del ministerio.

## Características

- 🛠️ **5 Herramientas MCP**: Comunicación completa del ciclo de vida de un servicio (Alta, Inicio, Anulación, Modificación, Consulta).
- 📜 **WS-Security X.509**: Firmado automático de peticiones SOAP mediante `BinarySecurityToken`.
- 🔐 **Soporte de Certificados**: Permite usar certificados `.p12` o `.pem` con clave privada.
- ✅ **Validación Local**: Reglas de negocio y formatos (matrículas, NIFs, códigos INE) validados antes de enviar la petición (Fail-Fast).
- 🔄 **Reintentos Inteligentes**: Lógica de reintento automático para timeouts y errores de red, sin reintentar errores funcionales.
- 🪵 **Logging Estructurado**: Trazabilidad completa con Pino.js.

## Prerrequisitos

- Node.js 20 o superior.
- Un certificado digital de clase 2 válido (titular o intermediario autorizado).

## Instalación

```bash
npm install
npm run build
```

## Configuración y Variables de Entorno

El servidor utiliza las siguientes variables de entorno para su configuración.

### Entorno y Conexión
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `RVTC_ENV` | Entorno del RVTC (`integration` o `production`) | `integration` |
| `RVTC_WSDL_URL` | URL explícita del WSDL (opcional, sobreescribe entorno) | - |
| `RVTC_INTERMEDIARIO_NIF` | NIF del intermediario. Obligatorio si env=`integration`| - |

### Certificado Digital
Puedes configurar el certificado usando un archivo `.p12`/`.pfx`, **o bien** con un par de archivos `.pem`.

**Opción 1: Archivo P12 (Recomendada)**
| Variable | Descripción |
|----------|-------------|
| `RVTC_P12_PATH` | Ruta absoluta al archivo `.p12` |
| `RVTC_P12_PASSWORD` | Contraseña del almacén `.p12` |

**Opción 2: Certificado PEM**
| Variable | Descripción |
|----------|-------------|
| `RVTC_CERT_PATH` | Ruta absoluta al certificado público `.pem` |
| `RVTC_KEY_PATH` | Ruta absoluta a la clave privada `.pem` |
| `RVTC_KEY_PASSWORD` | Contraseña de la clave privada (si está encriptada) |

### Avanzado
| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `LOG_LEVEL` | Nivel de logging (`debug`, `info`, `warn`, `error`) | `info` |
| `RVTC_HTTP_TIMEOUT_MS` | Timeout de la petición HTTPS SOAP en ms | `15000` |
| `RVTC_HTTP_RETRIES` | Número de reintentos por fallos de red | `2` |

## Herramientas MCP Expuestas

### `rvtc.create_service` (AltaDeServicio)
Registra un nuevo servicio de arrendamiento de vehículo con conductor.
- **Campos principales:** Matrícula, NIF titular, origen (Provincia/Municipio INE, Dirección), destino, fecha inicio/fin.
- **Nota:** En producción, origen y destino no pueden ser iguales salvo que se proporcione el punto más lejano. En integración se fuerzan valores de prueba.

### `rvtc.start_service` (InicioDeServicio)
Marca el momento de inicio real del servicio con el pasajero.

### `rvtc.cancel_service` (AnulacionDeServicio)
Cancela un servicio previamente comunicado que aún no ha sido iniciado.

### `rvtc.modify_service` (ModificacionDeServicio)
Permite cambiar el destino, punto lejano o la matrícula de un servicio (si su estado lo permite).

### `rvtc.get_service` (ConsultaDeServicio)
Obtiene los datos registrados de un servicio utilizando su identificador (`idServicio`).

## Testing

El proyecto incluye tests unitarios, de contrato (WS-Security) e integración real.

```bash
# Ejecutar tests unitarios y de contrato (simulación de firmas)
npm test

# Ejecutar tests de integración reales contra presede.mitma.gob.es
RVTC_RUN_INTEGRATION_TESTS=true \
RVTC_P12_PATH=/ruta/al/certificado.p12 \
RVTC_P12_PASSWORD=miContraseña \
RVTC_INTERMEDIARIO_NIF=12345678Z \
npx vitest run tests/integration/
```

## Ejecución del Servidor MCP

El servidor se comunica por `stdio`, por lo que está diseñado para ser invocado por un cliente MCP.

**Modo Desarrollo:**
```bash
npm run dev
```

**Modo Producción:**
```bash
npm start
```

### Ejemplo de integración en Claude Desktop

Añade este bloque al archivo `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-rvtc": {
      "command": "node",
      "args": ["/ruta/absoluta/a/MCP-Transportes/dist/index.js"],
      "env": {
        "RVTC_ENV": "integration",
        "RVTC_P12_PATH": "/Users/lunavarr/MCP-Transportes/Luis.p12",
        "RVTC_P12_PASSWORD": "Nazario1$",
        "RVTC_INTERMEDIARIO_NIF": "XXXXXXXX"
      }
    }
  }
}
```

## Arquitectura y Seguridad

- **SOAP y WS-Security**: Se usa `xml-crypto` (v6) para implementar algoritmos obligatorios por el RVTC: `exc-c14n` con `InclusiveNamespaces`, firma `rsa-sha1` sobre el `soapenv:Body`, e inserción explícita de `BinarySecurityToken` según el perfil X.509.
- **Fail-Fast**: En lugar de saturar el servicio del ministerio, todas las reglas de negocio (longitudes de códigos INE, formatos de matrículas según normativa vigente DGT, combinaciones origen/destino, fechas válidas) se comprueban usando esquemas de Zod antes del ensamblado XML.
