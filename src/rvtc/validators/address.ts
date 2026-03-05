/** Address validation: max 100 characters */

export function validateAddress(value: string, fieldName: string = 'Dirección'): string {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        throw new Error(`${fieldName} no puede estar vacía.`);
    }
    if (trimmed.length > 100) {
        throw new Error(
            `${fieldName} excede 100 caracteres (tiene ${trimmed.length}).`
        );
    }
    return trimmed;
}
