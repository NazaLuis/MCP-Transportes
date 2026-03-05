/** Business rule validations per RVTC manual */

import type { AltaInput, ModificacionInput } from '../types.js';
import { validateMatricula } from './matricula.js';
import { validateNif } from './nif.js';
import { validateProvinceINE, validateMunicipalityINE } from './ine.js';
import { validateAddress } from './address.js';
import { validateDateTime, validateDate } from './dates.js';

export interface ValidationContext {
    env: 'integration' | 'production';
    intermediarioNif?: string;
}

export function validateAltaInput(input: AltaInput, ctx: ValidationContext): AltaInput {
    const result = { ...input };

    // Normalize and validate fields
    result.matricula = validateMatricula(input.matricula);
    result.nifTitular = validateNif(input.nifTitular, 'NIF Titular');

    // Integration env requires specific values
    if (ctx.env === 'integration') {
        if (result.nifTitular !== '99999999R') {
            throw new Error(
                'En integración, nifTitular debe ser "99999999R".'
            );
        }
        if (!input.nifIntermediario && !ctx.intermediarioNif) {
            throw new Error(
                'En integración, nifIntermediario es obligatorio (RVTC_INTERMEDIARIO_NIF).'
            );
        }
    }

    if (input.nifIntermediario) {
        result.nifIntermediario = validateNif(input.nifIntermediario, 'NIF Intermediario');
    }

    // INE codes
    result.provContratoINE = validateProvinceINE(input.provContratoINE, 'Provincia contrato');
    result.muniContratoINE = validateMunicipalityINE(input.muniContratoINE, 'Municipio contrato');
    result.provInicioINE = validateProvinceINE(input.provInicioINE, 'Provincia inicio');
    result.muniInicioINE = validateMunicipalityINE(input.muniInicioINE, 'Municipio inicio');

    // Address
    result.direccionInicio = validateAddress(input.direccionInicio, 'Dirección inicio');

    // Dates
    result.fContrato = validateDateTime(input.fContrato, 'Fecha contrato');
    result.fPrevistaInicio = validateDateTime(input.fPrevistaInicio, 'Fecha prevista inicio');
    result.fFin = validateDate(input.fFin, 'Fecha fin');

    // Destination fields
    if (input.provFinINE || input.muniFinINE || input.direccionFin) {
        result.provFinINE = validateProvinceINE(input.provFinINE || '', 'Provincia fin');
        result.muniFinINE = validateMunicipalityINE(input.muniFinINE || '', 'Municipio fin');
        result.direccionFin = validateAddress(input.direccionFin || '', 'Dirección fin');
    }

    // Punto lejano fields
    if (input.provLejanoINE || input.muniLejanoINE || input.direccionLejano) {
        result.provLejanoINE = validateProvinceINE(input.provLejanoINE || '', 'Provincia lejano');
        result.muniLejanoINE = validateMunicipalityINE(input.muniLejanoINE || '', 'Municipio lejano');
        result.direccionLejano = validateAddress(input.direccionLejano || '', 'Dirección lejano');
    }

    // Business rule: if origin == destination, punto lejano is required
    const originSame = input.provFinINE &&
        input.provInicioINE === input.provFinINE &&
        input.muniInicioINE === input.muniFinINE;

    if (originSame && !input.provLejanoINE) {
        throw new Error(
            'Si origen y destino son iguales, debe comunicar el punto más lejano (provLejanoINE, muniLejanoINE, direccionLejano).'
        );
    }

    // Business rule: if destination is not free, fin fields required
    // (if any fin field is provided, all must be present)
    // Already validated above: if partial fin, we throw

    return result;
}

export function validateModificacionInput(input: ModificacionInput): ModificacionInput {
    const result = { ...input };

    if (typeof input.idServicio !== 'number' || !Number.isInteger(input.idServicio)) {
        throw new Error('idServicio debe ser un entero.');
    }

    if (input.provFinINE || input.muniFinINE || input.direccionFin) {
        result.provFinINE = validateProvinceINE(input.provFinINE || '', 'Provincia fin');
        result.muniFinINE = validateMunicipalityINE(input.muniFinINE || '', 'Municipio fin');
        result.direccionFin = validateAddress(input.direccionFin || '', 'Dirección fin');
    }

    if (input.provLejanoINE || input.muniLejanoINE || input.direccionLejano) {
        result.provLejanoINE = validateProvinceINE(input.provLejanoINE || '', 'Provincia lejano');
        result.muniLejanoINE = validateMunicipalityINE(input.muniLejanoINE || '', 'Municipio lejano');
        result.direccionLejano = validateAddress(input.direccionLejano || '', 'Dirección lejano');
    }

    if (input.matricula) {
        result.matricula = validateMatricula(input.matricula);
    }

    return result;
}

export function validateIdServicio(value: number): number {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error('idServicio debe ser un entero.');
    }
    return value;
}
