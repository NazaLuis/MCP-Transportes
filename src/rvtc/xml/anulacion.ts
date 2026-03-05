/** XML builder for AnulacionDeServicio (qanulacionvtc) */

import { buildHeader, buildSoapEnvelope, type XmlBuilderOptions } from './builder.js';

export function buildAnulacionXml(idServicio: number, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcservicio idservicio="${idServicio}"/>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qanulacionvtc', bodyContent);
}
