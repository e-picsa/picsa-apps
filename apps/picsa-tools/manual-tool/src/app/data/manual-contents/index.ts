import { IManualPeriodEntry, IManualVariant } from '../../models';
import { PICSA_MANUAL_CONTENTS_EXTENSION } from './extension';
import { PICSA_MANUAL_CONTENTS_FARMER } from './farmer';

export const PICSA_MANUAL_CONTENTS: { [variant in IManualVariant]: IManualPeriodEntry[] } = {
  extension: PICSA_MANUAL_CONTENTS_EXTENSION,
  farmer: PICSA_MANUAL_CONTENTS_FARMER,
};
