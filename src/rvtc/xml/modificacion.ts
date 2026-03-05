/** XML builder for ModificacionDeServicio (qmodificacionvtc) */

import type { ModificacionInput } from '../types.js';
import { buildHeader, buildSoapEnvelope, escapeXml, type XmlBuilderOptions } from './builder.js';

export function buildModificacionXml(input: ModificacionInput, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const children: string[] = [
        `          <idservicio>${input.idServicio}</idservicio>`,
    ];

    if (input.provFinINE) {
        children.push(`          <cgprovfin>${escapeXml(input.provFinINE)}</cgprovfin>`);
    }
    if (input.muniFinINE) {
        children.push(`          <cgmunifin>${escapeXml(input.muniFinINE)}</cgmunifin>`);
    }
    if (input.direccionFin) {
        children.push(`          <direccionfin>${escapeXml(input.direccionFin)}</direccionfin>`);
    }
    if (input.provLejanoINE) {
        children.push(`          <cgprovlejano>${escapeXml(input.provLejanoINE)}</cgprovlejano>`);
    }
    if (input.muniLejanoINE) {
        children.push(`          <cgmunilejano>${escapeXml(input.muniLejanoINE)}</cgmunilejano>`);
    }
    if (input.direccionLejano) {
        children.push(`          <direccionlejano>${escapeXml(input.direccionLejano)}</direccionlejano>`);
    }
    if (input.matricula) {
        children.push(`          <matricula>${escapeXml(input.matricula)}</matricula>`);
    }

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcservicio>`,
        ...children,
        `        </vtcservicio>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qmodificacionvtc', bodyContent);
}
