import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';

const MONTH_DATA_BASE = {
  january: { label: translateMarker('January'), labelShort: translateMarker('Jan') },
  february: { label: translateMarker('February'), labelShort: translateMarker('Feb') },
  march: { label: translateMarker('March'), labelShort: translateMarker('Mar') },
  april: { label: translateMarker('April'), labelShort: translateMarker('Apr') },
  may: { label: translateMarker('May'), labelShort: translateMarker('May') },
  june: { label: translateMarker('June'), labelShort: translateMarker('Jun') },
  july: { label: translateMarker('July'), labelShort: translateMarker('Jul') },
  august: { label: translateMarker('August'), labelShort: translateMarker('Aug') },
  september: { label: translateMarker('September'), labelShort: translateMarker('Sep') },
  october: { label: translateMarker('October'), labelShort: translateMarker('Oct') },
  november: { label: translateMarker('November'), labelShort: translateMarker('Nov') },
  december: { label: translateMarker('December'), labelShort: translateMarker('Dec') },
} as const;

type IMonthName = keyof typeof MONTH_DATA_BASE;

export const MONTH_DATA = Object.entries(MONTH_DATA_BASE)
  .map(([id, { label, labelShort }]) => {
    return { id: id as IMonthName, label: label as string, labelShort: labelShort as string };
  })
  .map((value, index) => ({ ...value, index }));

export const MONTH_DATA_HASHMAP = arrayToHashmap(MONTH_DATA, 'id');
