import {
  IStationCropData,
  IStationCropDataItem,
  IStationCropInformation,
} from '../../../../picsa-tools/crop-probability-tool/src/app/models';

export class DocParser {
  constructor(public rowData: string[][]) {}

  public run() {
    const meta = this.extractTableMeta();
    const cropData = this.extractCropProbabilities();
    const entry: IStationCropInformation = {
      // TODO - extract district and name from filenames
      id: `{district}/{station_name}`,
      station_district: '{district}',
      station_name: '{station_name}',
      dates: meta.startDates,
      notes: [], // TODO - could extract from child p elements
      season_probabilities: meta.startProbabilities,
      station_data: [],
    };
    return { ...meta, cropData };
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
        cropData[cropType] = [];
        currentCropType = cropType;
      }
      // store data within groups
      cropData[currentCropType].push({ days, variety, probabilities, water: [water] });
    }
    return Object.entries(cropData).map(([crop, data]) => {
      // TODO - handle crops that have been translated
      const entry: IStationCropData = { crop: crop as any, data };
      return entry;
    });
  }
}
