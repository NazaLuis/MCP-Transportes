/** Shared TypeScript types for the RVTC module */

export interface RvtcResponse {
    ok: boolean;
    resultado: string;
    idServicio: number | null;
    idComunica: number | null;
    idError: number | null;
    message: string;
    raw: {
        soap: string;
        parsed: Record<string, unknown>;
    };
}

export interface AltaInput {
    matricula: string;
    nifTitular: string;
    nifIntermediario?: string;
    provContratoINE: string;
    muniContratoINE: string;
    fContrato: string;
    provInicioINE: string;
    muniInicioINE: string;
    direccionInicio: string;
    fPrevistaInicio: string;
    fFin: string;
    provFinINE?: string;
    muniFinINE?: string;
    direccionFin?: string;
    provLejanoINE?: string;
    muniLejanoINE?: string;
    direccionLejano?: string;
    veraz: 'S' | 'N';
}

export interface IdServicioInput {
    idServicio: number;
}

export interface ModificacionInput {
    idServicio: number;
    provFinINE?: string;
    muniFinINE?: string;
    direccionFin?: string;
    provLejanoINE?: string;
    muniLejanoINE?: string;
    direccionLejano?: string;
    matricula?: string;
}

export type SoapOperation =
    | 'AltaDeServicio'
    | 'InicioDeServicio'
    | 'AnulacionDeServicio'
    | 'ModificacionDeServicio'
    | 'ConsultaDeServicio';

export const SOAP_ACTIONS: Record<SoapOperation, string> = {
    AltaDeServicio: 'http://www.fomento.org/VTCService/AltaDeServicio',
    InicioDeServicio: 'http://www.fomento.org/VTCService/Inicio',
    AnulacionDeServicio: 'http://www.fomento.org/VTCService/Anulacion',
    ModificacionDeServicio: 'http://www.fomento.org/VTCService/Modificacion',
    ConsultaDeServicio: 'http://www.fomento.org/VTCService/Consulta',
};
