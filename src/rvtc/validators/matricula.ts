/** Matrícula validation: format NNNN-LLL */

const MATRICULA_REGEX = /^\d{4}-[A-Z]{3}$/;

export function validateMatricula(value: string): string {
    const trimmed = value.trim().toUpperCase();
    if (!MATRICULA_REGEX.test(trimmed)) {
        throw new Error(
            `Matrícula inválida: "${value}". Formato esperado: NNNN-LLL (ej. 1234-BBB).`
        );
    }
    return trimmed;
}
