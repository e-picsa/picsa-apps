/** Fields required to define shared icon data */
export interface IPicsaDataWithIcons {
  /**
   * Name of svg icon registered to mat-icon within namespace
   * @example 'sunny' svgIcon within weather data will be available at <mat-icon svgIcon='picsa_weather:sunny'>
   **/
  svgIcon: string;
  /** Path to asset */
  assetIconPath: string;
}
