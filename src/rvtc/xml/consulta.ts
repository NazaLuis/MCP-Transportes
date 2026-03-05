/** XML builder for ConsultaDeServicio (qconsultavtc) */

import { buildHeader, buildSoapEnvelope, type XmlBuilderOptions } from './builder.js';

export function buildConsultaXml(idServicio: number, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcconsulta idservicio="${idServicio}"/>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qconsultavtc', bodyContent);
}
