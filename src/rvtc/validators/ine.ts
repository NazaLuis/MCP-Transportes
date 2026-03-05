/** INE code validation: province = 2 digits, municipality = 3 digits */

const PROVINCE_REGEX = /^\d{2}$/;
const MUNICIPALITY_REGEX = /^\d{3}$/;

export function validateProvinceINE(value: string, fieldName: string = 'Provincia INE'): string {
    const trimmed = value.trim();
    if (!PROVINCE_REGEX.test(trimmed)) {
        throw new Error(
            `${fieldName} inválido: "${value}". Código INE de provincia: exactamente 2 dígitos.`
        );
    }
    return trimmed;
}

export function validateMunicipalityINE(value: string, fieldName: string = 'Municipio INE'): string {
    const trimmed = value.trim();
    if (!MUNICIPALITY_REGEX.test(trimmed)) {
        throw new Error(
            `${fieldName} inválido: "${value}". Código INE de municipio: exactamente 3 dígitos.`
        );
    }
    return trimmed;
}
