/** XML builder for AltaDeServicio (qaltavtc) */

import type { AltaInput } from '../types.js';
import { buildHeader, buildSoapEnvelope, escapeXml, type XmlBuilderOptions } from './builder.js';

export function buildAltaXml(input: AltaInput, nifIntermediario?: string, opts?: XmlBuilderOptions): string {
    const header = buildHeader(opts);

    const attrs: string[] = [
        `matricula="${escapeXml(input.matricula)}"`,
        `niftitular="${escapeXml(input.nifTitular)}"`,
    ];

    const nif = input.nifIntermediario || nifIntermediario;
    if (nif) {
        attrs.push(`nif="${escapeXml(nif)}"`);
    }

    attrs.push(`cgprovcontrato="${escapeXml(input.provContratoINE)}"`);
    attrs.push(`cgmunicontrato="${escapeXml(input.muniContratoINE)}"`);
    attrs.push(`fcontrato="${escapeXml(input.fContrato)}"`);
    attrs.push(`cgprovinicio="${escapeXml(input.provInicioINE)}"`);
    attrs.push(`cgmuniinicio="${escapeXml(input.muniInicioINE)}"`);
    attrs.push(`direccioninicio="${escapeXml(input.direccionInicio)}"`);
    attrs.push(`fprevistainicio="${escapeXml(input.fPrevistaInicio)}"`);

    if (input.provFinINE) {
        attrs.push(`cgprovfin="${escapeXml(input.provFinINE)}"`);
    }
    if (input.muniFinINE) {
        attrs.push(`cgmunifin="${escapeXml(input.muniFinINE)}"`);
    }
    if (input.direccionFin) {
        attrs.push(`direccionfin="${escapeXml(input.direccionFin)}"`);
    }

    attrs.push(`ffin="${escapeXml(input.fFin)}"`);

    if (input.provLejanoINE) {
        attrs.push(`cgprovlejano="${escapeXml(input.provLejanoINE)}"`);
    }
    if (input.muniLejanoINE) {
        attrs.push(`cgmunilejano="${escapeXml(input.muniLejanoINE)}"`);
    }
    if (input.direccionLejano) {
        attrs.push(`direccionlejano="${escapeXml(input.direccionLejano)}"`);
    }

    attrs.push(`veraz="${escapeXml(input.veraz)}"`);

    const bodyContent = [
        `      ${header}`,
        `      <body>`,
        `        <vtcservicio ${attrs.join(' ')}/>`,
        `      </body>`,
    ].join('\n');

    return buildSoapEnvelope('qaltavtc', bodyContent);
}
