/** Date/DateTime validation per RVTC manual */

const DT_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export function validateDateTime(value: string, fieldName: string = 'Fecha/hora'): string {
    const trimmed = value.trim();
    if (!DT_REGEX.test(trimmed)) {
        throw new Error(
            `${fieldName} inválido: "${value}". Formato esperado: YYYY-MM-DDThh:mm:ss.`
        );
    }
    // Verify it's a real date
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) {
        throw new Error(`${fieldName} no es una fecha válida: "${value}".`);
    }
    return trimmed;
}

export function validateDate(value: string, fieldName: string = 'Fecha'): string {
    const trimmed = value.trim();
    if (!DATE_REGEX.test(trimmed)) {
        throw new Error(
            `${fieldName} inválido: "${value}". Formato esperado: YYYY-MM-DD.`
        );
    }
    const d = new Date(trimmed + 'T00:00:00');
    if (isNaN(d.getTime())) {
        throw new Error(`${fieldName} no es una fecha válida: "${value}".`);
    }
    return trimmed;
}

export function formatNow(): string {
    return new Date().toISOString().replace(/\.\d{3}Z$/, '');
}

export function formatToday(): string {
    return new Date().toISOString().slice(0, 10);
}
