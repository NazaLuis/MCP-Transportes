/** XML builder for InicioDeServicio (qiniciovtc) */

import { buildHeader, buildSoapEnvelope, type XmlBuilderOptions } from './builder.js';

export function buildInicioXml(idServicio: number, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcservicio>`,
        `          <idservicio>${idServicio}</idservicio>`,
        `        </vtcservicio>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qiniciovtc', bodyContent);
}
