/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/v1/status/": {
    /**
     * Get Status
     * @description Check server up and authorized to access data
     */
    get: operations["get_status_v1_status__get"];
  };
  "/v1/annual_rainfall_summaries/": {
    /** Get Annual Rainfall Summaries */
    post: operations["get_annual_rainfall_summaries_v1_annual_rainfall_summaries__post"];
  };
  "/v1/annual_temperature_summaries/": {
    /** Get Annual Temperature Summaries */
    post: operations["get_annual_temperature_summaries_v1_annual_temperature_summaries__post"];
  };
  "/v1/crop_success_probabilities/": {
    /** Get Crop Success Probabilities */
    post: operations["get_crop_success_probabilities_v1_crop_success_probabilities__post"];
  };
  "/v1/monthly_temperature_summaries/": {
    /** Get Monthly Temperature Summaries */
    post: operations["get_monthly_temperature_summaries_v1_monthly_temperature_summaries__post"];
  };
  "/v1/season_start_probabilities/": {
    /** Get Season Start Probabilities */
    post: operations["get_season_start_probabilities_v1_season_start_probabilities__post"];
  };
  "/v1/extremes_summaries/": {
    /** Get Extremes Summaries */
    post: operations["get_extremes_summaries_v1_extremes_summaries__post"];
  };
  "/v1/station/": {
    /** Read Stations */
    get: operations["read_stations_v1_station__get"];
  };
  "/v1/station/{country}": {
    /** Read Stations */
    get: operations["read_stations_v1_station__country__get"];
  };
  "/v1/station/{country}/{station_id}": {
    /** Read Stations */
    get: operations["read_stations_v1_station__country___station_id__get"];
  };
  "/v1/forecasts/": {
    /** Get Forecasts */
    get: operations["get_forecasts_v1_forecasts__get"];
  };
  "/v1/forecasts/{country}/{file_name}": {
    /** Get Forecasts */
    get: operations["get_forecasts_v1_forecasts__country___file_name__get"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /** AnnualRainfallSummariesParameters */
    AnnualRainfallSummariesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default 01122
       */
      station_id?: string;
      /**
       * Summaries
       * @default [
       *   "annual_rain",
       *   "start_rains",
       *   "end_rains",
       *   "end_season",
       *   "seasonal_rain",
       *   "seasonal_length"
       * ]
       */
      summaries?: ("annual_rain" | "start_rains" | "end_rains" | "end_season" | "seasonal_rain" | "seasonal_length")[];
    };
    /** AnnualTemperatureSummariesParameters */
    AnnualTemperatureSummariesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default 16
       */
      station_id?: string;
      /**
       * Summaries
       * @default [
       *   "mean_tmin",
       *   "mean_tmax"
       * ]
       */
      summaries?: ("mean_tmin" | "mean_tmax")[];
    };
    /** CropSuccessProbabilitiesParameters */
    CropSuccessProbabilitiesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default 16
       */
      station_id?: string;
      /** Water Requirements */
      water_requirements?: number[];
      /** Planting Length */
      planting_length?: number[];
      /** Planting Dates */
      planting_dates?: number[];
      /** Start Before Season */
      start_before_season?: boolean;
    };
    /** ExtremesSummariesParameters */
    ExtremesSummariesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default test_1
       */
      station_id?: string;
      /**
       * Summaries
       * @default [
       *   "extremes_rain",
       *   "extremes_tmin",
       *   "extremes_tmax"
       * ]
       */
      summaries?: ("extremes_rain" | "extremes_tmin" | "extremes_tmax")[];
    };
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components["schemas"]["ValidationError"][];
    };
    /** MonthlyTemperatureSummariesParameters */
    MonthlyTemperatureSummariesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default 16
       */
      station_id?: string;
      /**
       * Summaries
       * @default [
       *   "mean_tmin",
       *   "mean_tmax"
       * ]
       */
      summaries?: ("mean_tmin" | "mean_tmax")[];
    };
    /** SeasonStartProbabilitiesParameters */
    SeasonStartProbabilitiesParameters: {
      /**
       * Country
       * @default zm
       * @enum {string}
       */
      country?: "zm" | "mw";
      /**
       * Station Id
       * @default 16
       */
      station_id?: string;
      /** Start Dates */
      start_dates?: number[];
    };
    /** Station */
    Station: {
      /**
       * Country Code
       * @enum {string}
       */
      country_code: "zm" | "mw";
      /** District */
      district: string;
      /** Elevation */
      elevation: number;
      /** Latitude */
      latitude: number;
      /** Longitude */
      longitude: number;
      /** Station Id */
      station_id: number;
      /** Station Name */
      station_name: string;
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: string[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /**
   * Get Status
   * @description Check server up and authorized to access data
   */
  get_status_v1_status__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
  /** Get Annual Rainfall Summaries */
  get_annual_rainfall_summaries_v1_annual_rainfall_summaries__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["AnnualRainfallSummariesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Annual Temperature Summaries */
  get_annual_temperature_summaries_v1_annual_temperature_summaries__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["AnnualTemperatureSummariesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Crop Success Probabilities */
  get_crop_success_probabilities_v1_crop_success_probabilities__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["CropSuccessProbabilitiesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Monthly Temperature Summaries */
  get_monthly_temperature_summaries_v1_monthly_temperature_summaries__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["MonthlyTemperatureSummariesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Season Start Probabilities */
  get_season_start_probabilities_v1_season_start_probabilities__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["SeasonStartProbabilitiesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Extremes Summaries */
  get_extremes_summaries_v1_extremes_summaries__post: {
    requestBody: {
      content: {
        "application/json": components["schemas"]["ExtremesSummariesParameters"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Read Stations */
  read_stations_v1_station__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["Station"][];
        };
      };
    };
  };
  /** Read Stations */
  read_stations_v1_station__country__get: {
    parameters: {
      path: {
        country: "zm" | "mw";
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Read Stations */
  read_stations_v1_station__country___station_id__get: {
    parameters: {
      path: {
        country: "zm" | "mw";
        station_id: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Forecasts */
  get_forecasts_v1_forecasts__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
  /** Get Forecasts */
  get_forecasts_v1_forecasts__country___file_name__get: {
    parameters: {
      path: {
        country: "zm" | "mw";
        file_name: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
}
