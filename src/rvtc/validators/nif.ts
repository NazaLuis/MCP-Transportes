/** NIF validation: exactly 9 characters */

export function validateNif(value: string, fieldName: string = 'NIF'): string {
    const trimmed = value.trim();
    if (trimmed.length !== 9) {
        throw new Error(
            `${fieldName} inválido: "${value}". Debe tener exactamente 9 caracteres.`
        );
    }
    return trimmed;
}
