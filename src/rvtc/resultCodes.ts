/** RVTC result code → human-readable message mapping (from manual V2.4) */

export const RESULT_CODES: Record<string, string> = {
    // Success
    '00': 'Operación correcta',

    // Alta errors
    '51': 'El NIF que comunica no puede crear servicios para ese intermediario y matrícula',
    '52': 'El NIF comunicado no puede gestionar servicios para esa matrícula',
    '53': 'El NIF del intermediario no es correcto',
    '54': 'El NIF del titular no es correcto',
    '55': 'La fecha de contrato debe ser anterior a la fecha prevista de inicio',
    '56': 'La fecha y hora prevista de inicio debe ser posterior a la fecha y hora actual',
    '57': 'La fecha fin del servicio debe ser igual o posterior a la fecha de inicio',
    '58': 'La provincia del contrato no es correcta',
    '59': 'La provincia de origen no es correcta',
    '60': 'La provincia de destino no es correcta',
    '61': 'La provincia del lugar más lejano no es correcta',
    '62': 'El municipio del contrato no es correcto',
    '63': 'El municipio inicio no es correcto',
    '64': 'El municipio fin no es correcto',
    '65': 'El municipio del lugar más lejano no es correcto',
    '66': 'Los lugares de inicio y fin son iguales. Debe comunicar el punto más lejano.',
    '67': 'El identificador del servicio es erróneo o el servicio ya está anulado',
    '68': 'El identificador del servicio es erróneo o el servicio ya está iniciado',
    '69': 'Error en el SW al crear el servicio',
    '70': 'Error en el SW al iniciar el servicio',
    '71': 'Error en el SW al anular el servicio',
    '72': 'Error en el SW al modificar el servicio',
    '73': 'Código de servicio incorrecto',
    '74': 'Error en el SW al consultar el servicio/matrícula',
    '78': 'El servicio que se intenta modificar ya ha finalizado',
    '79': 'El formato de la matrícula no es correcto',
    '81': 'El identificador del servicio es erróneo o el servicio no se puede modificar',
    '82': 'No se puede iniciar el servicio indicado. Su fecha prevista de inicio es anterior a la última iniciación.',
    '83': 'El titular no dispone de la autorización de esa matrícula',
    '84': 'El NIF comunicado no puede gestionar servicios',
    '85': 'Error al crear el servicio',
    '86': 'Error al iniciar el servicio',
    '87': 'Error al anular el servicio',
    '88': 'Error al modificar el servicio',
    '89': 'Error al consultar el servicio/matrícula',
};

export function getResultMessage(code: string): string {
    return RESULT_CODES[code] || `Error desconocido (código: ${code})`;
}
