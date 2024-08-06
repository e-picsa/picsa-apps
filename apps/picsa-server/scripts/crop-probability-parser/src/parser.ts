import {
  IStationCropData,
  IStationCropDataItem,
  IStationCropInformation,
} from '../../../../picsa-tools/crop-probability-tool/src/app/models';

export class DocParser {
  constructor(public rowData: string[][]) {}

  public run() {
    const meta = this.extractTableMeta();
    const data = this.extractCropProbabilities();
    const entry: IStationCropInformation = {
      id: '', // populated later
      station_district_id: '', // populated later
      station_name: removeLinebreaks(meta.title),
      dates: this.parseDates(meta.startDates),
      season_probabilities: this.parseProbabilities(meta.startProbabilities),
      notes: [], // TODO - could extract from child p elements
      data,
    };
    return entry;
  }
  private extractTableMeta() {
    // Process and remove the first 4 rows of data which contain various metadata
    const [titleRow, probabilityTextRow, probabilityRow, headerRow] = this.rowData.splice(0, 4);
    const [title, ...startDates] = titleRow;
    const [_, ...startProbabilities] = probabilityRow;
    return { title, startDates, startProbabilities };
  }
  private extractCropProbabilities() {
    const cropData: Record<string, IStationCropDataItem[]> = {};
    let currentCropType = '';
    for (const row of this.rowData) {
      const [cropType, variety, days, water, ...probabilities] = row;
      // only the first row in a crop group contains the name, so track for next
      if (cropType) {
        currentCropType = this.parseCropType(cropType);
        cropData[currentCropType] = [];
      }
      // store data within groups
      cropData[currentCropType].push({
        variety: removeLinebreaks(variety),
        days,
        water: [water],
        probabilities: this.parseProbabilities(probabilities),
      });
    }
    return Object.entries(cropData).map(([crop, data]) => {
      // TODO - handle crops that have been translated
      const entry: IStationCropData = { crop: crop as any, data };
      return entry;
    });
  }

  /** Ensure crops formatted in lower-case without spaces (use `-`) */
  private parseCropType(text: string) {
    const lower = text.toLowerCase().trim();
    return removeLinebreaks(lower).replace(/ /g, '-');
  }

  /** Ensure linebreaks remove from probabilities */
  private parseProbabilities(entries: string[]) {
    return entries.map((text) => removeLinebreaks(text));
  }

  /** Ensure linebreaks removed from dates */
  private parseDates(entries: string[]) {
    return entries.map((text) => removeLinebreaks(text));
  }
}
function removeLinebreaks(text: string) {
  return text.replace(/\n/g, '');
}
