import { describe, it, expect } from 'vitest';
import {
  validateMatricula,
  validateNif,
  validateProvinceINE,
  validateMunicipalityINE,
  validateAddress,
  validateDateTime,
  validateDate,
  validateAltaInput,
} from '../../src/rvtc/validators/index.js';

describe('Validators', () => {
  describe('Matrícula', () => {
    it('should validate correct matrícula format', () => {
      expect(validateMatricula('1234-BBB')).toBe('1234-BBB');
      expect(validateMatricula(' 9999-zzz  ')).toBe('9999-ZZZ');
    });

    it('should throw on invalid formats', () => {
      expect(() => validateMatricula('1234BBB')).toThrow();
      expect(() => validateMatricula('123-BBB')).toThrow();
      expect(() => validateMatricula('1234-B1B')).toThrow();
    });
  });

  describe('NIF', () => {
    it('should validate exactly 9 characters', () => {
      expect(validateNif('12345678Z')).toBe('12345678Z');
      expect(() => validateNif('12345678')).toThrow();
      expect(() => validateNif('12345678ZA')).toThrow();
    });
  });

  describe('INE Codes', () => {
    it('should validate province (2 digits)', () => {
      expect(validateProvinceINE('28')).toBe('28');
      expect(() => validateProvinceINE('2')).toThrow();
      expect(() => validateProvinceINE('288')).toThrow();
      expect(() => validateProvinceINE('AA')).toThrow();
    });

    it('should validate municipality (3 digits)', () => {
      expect(validateMunicipalityINE('079')).toBe('079');
      expect(() => validateMunicipalityINE('79')).toThrow();
      expect(() => validateMunicipalityINE('0079')).toThrow();
    });
  });

  describe('Address', () => {
    it('should validate address length', () => {
      expect(validateAddress('Calle Falsa 123')).toBe('Calle Falsa 123');
      expect(() => validateAddress('')).toThrow();
      expect(() => validateAddress('a'.repeat(101))).toThrow();
    });
  });

  describe('Dates', () => {
    it('should validate DT format (YYYY-MM-DDThh:mm:ss)', () => {
      expect(validateDateTime('2024-03-05T12:00:00')).toBe('2024-03-05T12:00:00');
      expect(() => validateDateTime('2024-03-05')).toThrow();
      expect(() => validateDateTime('2024-03-05 12:00:00')).toThrow();
      // Invalid date
      expect(() => validateDateTime('2024-13-45T12:00:00')).toThrow();
    });

    it('should validate Date format (YYYY-MM-DD)', () => {
      expect(validateDate('2024-12-31')).toBe('2024-12-31');
      expect(() => validateDate('2024-12-31T12:00:00')).toThrow();
      expect(() => validateDate('31/12/2024')).toThrow();
    });
  });

  describe('Business Rules (Alta)', () => {
    const validBaseInput = {
      matricula: '1234-BBB',
      nifTitular: '11111111H',
      provContratoINE: '28',
      muniContratoINE: '079',
      fContrato: '2024-03-05T10:00:00',
      provInicioINE: '28',
      muniInicioINE: '079',
      direccionInicio: 'Origen',
      fPrevistaInicio: '2024-03-05T12:00:00',
      fFin: '2024-03-06',
      veraz: 'S' as const,
    };

    it('should fail if origin == destination and no punto lejano', () => {
      const input = {
        ...validBaseInput,
        provFinINE: '28',
        muniFinINE: '079',
        direccionFin: 'Destino',
      };
      expect(() => validateAltaInput(input, { env: 'production' })).toThrow(/punto más lejano/);
    });

    it('should pass if origin == destination and punto lejano present', () => {
      const input = {
        ...validBaseInput,
        provFinINE: '28',
        muniFinINE: '079',
        direccionFin: 'Destino',
        provLejanoINE: '28',
        muniLejanoINE: '001',
        direccionLejano: 'Lejano',
      };
      const result = validateAltaInput(input, { env: 'production' });
      expect(result.provLejanoINE).toBe('28');
    });

    it('should enforce integration rules', () => {
      const input = { ...validBaseInput };
      // Wrong titlular in integration
      expect(() => validateAltaInput(input, { env: 'integration' })).toThrow(/nifTitular debe ser "99999999R"/);
      
      // Correct titular but no intermediario and no config
      const input2 = { ...validBaseInput, nifTitular: '99999999R' };
      expect(() => validateAltaInput(input2, { env: 'integration' })).toThrow(/nifIntermediario es obligatorio/);
    });
  });
});
