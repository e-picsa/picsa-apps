// import { dispatch } from '@angular-redux/store';
// import { Injectable } from '@angular/core';
// import { FluxStandardAction } from 'flux-standard-action';
// import { IChartMeta, ISite } from '@picsa/core/models/climate.models';

// type StandardAction = FluxStandardAction<string, ISite | IChartMeta>;

// @Injectable({ providedIn: 'root' })
// export class ClimateToolActions {
//   static readonly SELECT_SITE = 'SELECT_SITE';
//   static readonly UPDATE_SITE = 'UPDATE_SITE';
//   static readonly SELECT_CHART = 'SELECT_CHART';
//   static readonly RESET_STATE = 'RESET_STATE';

//   @dispatch()
//   selectSite = (site: ISite): StandardAction => ({
//     type: ClimateToolActions.SELECT_SITE,
//     payload: site,
//     meta: null
//   });
//   @dispatch()
//   updateSite = (sitePartial): StandardAction => ({
//     type: ClimateToolActions.UPDATE_SITE,
//     payload: sitePartial,
//     meta: null
//   });
//   @dispatch()
//   selectChart = (chart: IChartMeta): StandardAction => ({
//     type: ClimateToolActions.SELECT_CHART,
//     payload: chart,
//     meta: null
//   });
//   @dispatch()
//   resetState = (): StandardAction => ({
//     type: ClimateToolActions.RESET_STATE,
//     meta: null,
//     payload: null
//   });
// }
