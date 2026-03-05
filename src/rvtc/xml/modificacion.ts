/** XML builder for ModificacionDeServicio (qmodificacionvtc) */

import type { ModificacionInput } from '../types.js';
import { buildHeader, buildSoapEnvelope, escapeXml, type XmlBuilderOptions } from './builder.js';

export function buildModificacionXml(input: ModificacionInput, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const attrs: string[] = [
        `idservicio="${input.idServicio}"`
    ];

    if (input.provFinINE) {
        attrs.push(`cgprovfin="${escapeXml(input.provFinINE)}"`);
    }
    if (input.muniFinINE) {
        attrs.push(`cgmunifin="${escapeXml(input.muniFinINE)}"`);
    }
    if (input.direccionFin) {
        attrs.push(`direccionfin="${escapeXml(input.direccionFin)}"`);
    }
    if (input.provLejanoINE) {
        attrs.push(`cgprovlejano="${escapeXml(input.provLejanoINE)}"`);
    }
    if (input.muniLejanoINE) {
        attrs.push(`cgmunilejano="${escapeXml(input.muniLejanoINE)}"`);
    }
    if (input.direccionLejano) {
        attrs.push(`direccionlejano="${escapeXml(input.direccionLejano)}"`);
    }
    if (input.matricula) {
        attrs.push(`matricula="${escapeXml(input.matricula)}"`);
    }

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcservicio ${attrs.join(' ')}/>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qmodificacionvtc', bodyContent);
}
