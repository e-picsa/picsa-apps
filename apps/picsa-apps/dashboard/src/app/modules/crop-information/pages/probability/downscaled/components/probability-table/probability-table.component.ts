import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { AlertBoxComponent } from '@picsa/components/src';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { CropProbabilityTableComponent as CropProbabilityTableFrontend } from '@picsa/crop-probability/src/app/components/crop-probability-table/crop-probability-table.component';
// eslint-disable-next-line @nx/enforce-module-boundaries
import type { IProbabilityTableMeta, IStationCropData } from '@picsa/crop-probability/src/app/models';
import { ICropName } from '@picsa/data';
import { arrayToHashmap } from '@picsa/utils';

import { ICropSuccessEntry, IStationRow } from '../../../../../../climate/types';
import { CropInformationService, ICropData, ICropDataDownscaledWaterRequirements } from '../../../../../services';
import { CropProbabilityLanguageSelectComponent } from '../language-select/language-select.component';

const WATER_REQUIREMENT_ROUNDING = 25;
const DAY_REQUIREMENT_ROUNDING = 15;

const CROP_SORT_PRIORITY: ICropName[] = [
  'maize',
  'sorghum',
  'beans',
  'groundnuts',
  'soya-beans',
  'sunflower',
  'cowpeas',
  'cotton',
  'tobacco',
  'sweet-potatoes',
];

export type ISeasonStartProbability = { plantDate: number; label: string; probability: number };

@Component({
  selector: 'dashboard-crop-probability-table',
  imports: [
    AlertBoxComponent,
    MatButtonModule,
    MatIcon,
    RouterModule,
    CropProbabilityTableFrontend,
    CropProbabilityLanguageSelectComponent,
  ],
  templateUrl: './probability-table.component.html',
  styleUrl: './probability-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CropProbabilityTableComponent {
  private service = inject(CropInformationService);
  dialog = inject(MatDialog);

  /** Location water requiremetns */
  waterRequirements = input.required<ICropDataDownscaledWaterRequirements>();
  /** Station crop probability lookup table entries */
  stationProbabilities = input.required<ICropSuccessEntry[]>();
  /** Station row for use in missing station data redirect */
  station = input.required<IStationRow>();

  startProbabilities = input.required<ISeasonStartProbability[]>();

  locationName = input.required<string>();

  public hasDownscaledWaterRequirements = computed(() => Object.keys(this.waterRequirements()).length > 0);
  public hasStationCropProbabilities = computed(() => this.stationProbabilities().length > 0);

  private tableComponentRef = viewChild(CropProbabilityTableFrontend, { read: ElementRef });

  private cropDataHashmap = computed(() => arrayToHashmap(this.service.cropData(), 'id'));
  private probabilityHashmap = computed(() => this.generateProbabilityHashmap(this.stationProbabilities()));

  public tableData = computed(() => {
    const cropDataHashmap = this.cropDataHashmap();
    const waterRequirements = this.waterRequirements() || {};
    const startProbabilities = this.startProbabilities() || [];
    return this.generateTable({ cropDataHashmap, waterRequirements, startProbabilities });
  });

  public tableMeta = computed<IProbabilityTableMeta>(() => {
    return {
      id: '', // generated on export
      label: this.locationName(),
      station_label: this.station().station_name as string,
      dateHeadings: this.startProbabilities().map((v) => v.label),
      seasonProbabilities: this.startProbabilities().map((v) => toProbabilityOutOfTen(v.probability) + ' / 10'),
    };
  });

  public copyStatus = signal<'ready' | 'pending' | 'success'>('ready');

  public exportAppJson() {
    const output = { meta: this.tableMeta(), data: this.tableData() };
    // TODO - export full app format (currently just logged)
    console.log(output);
  }
  public copyToClipboard() {
    this.copyStatus.set('pending');
    // Get the HTML of the table
    const el = this.tableComponentRef()?.nativeElement as HTMLDivElement;
    if (el) {
      const tableEl = el.querySelector('table');
      if (tableEl) {
        copyTableWithClipboardApi(tableEl);
        this.copyStatus.set('success');
        setTimeout(() => {
          this.copyStatus.set('ready');
        }, 1500);
        // deprecated api - may not work on all browsers
        // copyTableWithExecCommand(tableEl);
      }
      return;
    }
  }

  private generateTable(params: {
    cropDataHashmap: Record<string, ICropData['Row']>;
    waterRequirements: ICropDataDownscaledWaterRequirements;
    startProbabilities: ISeasonStartProbability[];
  }) {
    const { cropDataHashmap, waterRequirements, startProbabilities } = params;
    const entries: IStationCropData[] = [];
    const plantDates = startProbabilities.map((v) => v.plantDate);
    for (const [crop, requirements] of Object.entries(waterRequirements)) {
      const entry: IStationCropData = {
        crop: crop as ICropName,
        data: [],
      };
      for (const [variety, waterRequirement] of Object.entries(requirements)) {
        const varietyData = cropDataHashmap[`${crop}/${variety}`];
        if (varietyData) {
          const { days_lower, days_upper } = varietyData;
          const days = { lower: days_lower, upper: days_upper };
          const probabilities = {
            lower: this.getCropSuccessProbability(waterRequirement, days_lower, plantDates),
            upper: this.getCropSuccessProbability(waterRequirement, days_upper, plantDates),
          };
          const probabilityText = this.generateProbabilityEntryText(probabilities, plantDates);
          // HACK - convert to legacy table format
          // TODO - review and possibly tidy up
          entry.data.push({
            days: [...new Set([days.lower, days_upper])].join(' - '),
            variety,
            probabilities: probabilityText,
            water: [waterRequirement],
          });
        } else {
          console.warn(`no variety data found for [${crop}/${variety}]`);
        }
      }
      entries.push(entry);
    }

    // sort by crop priority and replace crop name with label
    return entries.sort(this.sortByPriorityCrops);
  }

  private sortByPriorityCrops(a: IStationCropData, b: IStationCropData) {
    const aPriority = CROP_SORT_PRIORITY.includes(a.crop) ? CROP_SORT_PRIORITY.indexOf(a.crop) : 99;
    const bPriority = CROP_SORT_PRIORITY.includes(b.crop) ? CROP_SORT_PRIORITY.indexOf(b.crop) : 99;
    return aPriority - bPriority;
  }

  /** Create a hashmap or probabilities nested by water requirement and plant length */
  private generateProbabilityHashmap(entries: ICropSuccessEntry[]) {
    const hashmap: { [water_req: number]: { [plant_length: number]: { [plant_day: number]: number } } } = {};
    for (const entry of entries) {
      const { plant_day, plant_length, total_rain, prop_success_no_start } = entry;
      hashmap[total_rain] ??= {};
      hashmap[total_rain][plant_length] ??= {};
      hashmap[total_rain][plant_length][plant_day] = prop_success_no_start;
    }
    return hashmap;
  }

  private generateProbabilityEntryText(probabilities: { upper: number[]; lower: number[] }, plantDates: number[]) {
    return plantDates.map((v, i) => {
      const lower = probabilities.lower[i];
      const upper = probabilities.upper[i];
      if (typeof lower === 'number' && typeof upper === 'number') {
        const mean = (probabilities.lower[i] + probabilities.upper[i]) / 2;
        return `${toProbabilityOutOfTen(mean)} / 10`;
      }
      // If probability NaN simply return as empty string
      return '';
    });
  }

  private getCropSuccessProbability(water: number, days: number, plantDates: number[]) {
    const waterRounded = roundToNearest(water, WATER_REQUIREMENT_ROUNDING);
    const daysRounded = roundToNearest(days, DAY_REQUIREMENT_ROUNDING);
    const probabilities: number[] = [];
    for (const value of plantDates) {
      const probability = this.probabilityHashmap()[waterRounded]?.[daysRounded]?.[value];
      probabilities.push(probability);
    }

    return probabilities;
  }
}

/**
 * Use (deprecated) internal `execCommand` to copy a table element in the same
 * way that manually copying does
 */
function copyTableWithExecCommand(tableElement: Element) {
  const range = document.createRange();
  range.selectNode(tableElement);
  const selection = window.getSelection();
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);

    try {
      document.execCommand('copy');
    } finally {
      selection.removeAllRanges();
    }
  }
}

/**
 * Use clipboard api to copy table element, inlining styles and removing
 * comments and attributes not supported in word docs
 */
function copyTableWithClipboardApi(tableEl: HTMLTableElement) {
  const cleanedEl = inlineElementStyles(tableEl);
  const htmlBlob = new Blob([cleanedEl.outerHTML], { type: 'text/html' });
  const textBlob = new Blob([cleanedEl.innerText], { type: 'text/plain' });
  navigator.clipboard.write([
    new ClipboardItem({
      'text/html': htmlBlob,
      'text/plain': textBlob,
    }),
  ]);
}

function roundToNearest(value: number, n: number) {
  return Math.round(value / n) * n;
}
function toProbabilityOutOfTen(value: number) {
  return Math.round(value * 10);
}

function inlineElementStyles<T extends Element>(element: T) {
  // Clone the SVG to avoid modifying the original
  const clone = element.cloneNode(true) as T;

  // Get all elements in the SVG
  const allElements = [clone, ...clone.querySelectorAll('*')];
  const originalElements = [element, ...element.querySelectorAll('*')];

  // Apply computed styles to each element
  allElements.forEach((element, index) => {
    const originalElement = originalElements[index];

    if (originalElement) {
      inlineStyles(originalElement, element);

      // Remove all classes
      element.removeAttribute('class');

      // Remove all non-essential attributes
      removeAttributes(element);
    }
  });
  removeComments(clone);
  return clone;
}

function inlineStyles(originalElement: Element, cloneElement: Element) {
  const allowedProps = ['color', 'font-size', 'font-weight', 'text-align', 'border', 'background', 'padding'];
  const computedStyle = window.getComputedStyle(originalElement);
  const styleString = Array.from(computedStyle)
    .filter((prop) => computedStyle.getPropertyValue(prop))
    .filter((prop) => allowedProps.find((v) => prop.startsWith(v)))
    .map((prop) => `${prop}: ${computedStyle.getPropertyValue(prop)}`)
    .join('; ');

  if (styleString) {
    cloneElement.setAttribute('style', styleString);
  }
}

function removeAttributes(element: Element) {
  const allowedAttrs = new Set(['rowspan', 'colspan', 'style']);
  Array.from(element.attributes).forEach((attr) => {
    if (!allowedAttrs.has(attr.name)) {
      element.removeAttribute(attr.name);
    }
  });
}

// Remove all comment nodes recursively
function removeComments(node: Node) {
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      removeComments(child);
    }
  }
}
