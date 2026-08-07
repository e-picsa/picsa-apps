import { IStationCropDataItem } from '../models';

/**
 * Extract numeric min days, max days, and calculated midpoint for a crop item.
 */
export function getDaysBounds(item: IStationCropDataItem): { minDays: number; maxDays: number; midpoint: number } {
  let minDays: number;
  let maxDays: number;

  if (typeof item.days_lower === 'number' && typeof item.days_upper === 'number') {
    minDays = item.days_lower;
    maxDays = item.days_upper;
  } else {
    const nums = (item.days || '').match(/\d+/g)?.map(Number) || [];
    if (nums.length >= 2) {
      minDays = Math.min(...nums);
      maxDays = Math.max(...nums);
    } else if (nums.length === 1) {
      minDays = nums[0];
      maxDays = nums[0];
    } else {
      minDays = 0;
      maxDays = 0;
    }
  }

  const midpoint = (minDays + maxDays) / 2;
  return { minDays, maxDays, midpoint };
}

/**
 * Group crop items sharing identical water requirements and probabilities into single rows
 * and sort the grouped rows in ascending order of days midpoint.
 */
export function groupAndSortCropDataItems(items: IStationCropDataItem[]): IStationCropDataItem[] {
  const groupsHashmap = new Map<
    string,
    { items: IStationCropDataItem[]; water: number[]; probabilities: (number | null)[] }
  >();

  for (const item of items) {
    const waterKey = (item.water || []).join(',');
    const probKey = JSON.stringify(item.probabilities || []);
    const reqKey = `${waterKey}|${probKey}`;

    if (!groupsHashmap.has(reqKey)) {
      groupsHashmap.set(reqKey, {
        items: [item],
        water: item.water || [],
        probabilities: item.probabilities || [],
      });
    } else {
      groupsHashmap.get(reqKey)!.items.push(item);
    }
  }

  const result: IStationCropDataItem[] = [];

  for (const group of groupsHashmap.values()) {
    const varieties = [
      ...new Set(
        group.items
          .flatMap((it) => (it.variety || '').split(/,\s*/))
          .map((v) => v.trim())
          .filter(Boolean),
      ),
    ];

    const boundsList = group.items.map((it) => getDaysBounds(it));
    const minDays = Math.min(...boundsList.map((b) => b.minDays));
    const maxDays = Math.max(...boundsList.map((b) => b.maxDays));

    const daysStr = minDays === maxDays ? `${minDays}` : `${minDays} - ${maxDays}`;
    const varietyStr = varieties.join(', ');

    result.push({
      variety: varietyStr,
      days: daysStr,
      days_lower: minDays,
      days_upper: maxDays,
      water: group.water,
      probabilities: group.probabilities,
    });
  }

  result.sort((a, b) => {
    const aBounds = getDaysBounds(a);
    const bBounds = getDaysBounds(b);

    if (aBounds.midpoint !== bBounds.midpoint) {
      return aBounds.midpoint - bBounds.midpoint;
    }
    if (aBounds.minDays !== bBounds.minDays) {
      return aBounds.minDays - bBounds.minDays;
    }
    return a.variety.localeCompare(b.variety);
  });

  return result;
}
