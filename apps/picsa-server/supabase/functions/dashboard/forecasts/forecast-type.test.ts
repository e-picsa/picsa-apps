import { describe, it } from 'https://deno.land/std@0.204.0/testing/bdd.ts';
import { assertEquals } from 'jsr:@std/assert';

import { decodeMimeSubject, mapForecastType } from './forecast-type.ts';

const zmSender = 'weather Zambia <zambianweather@gmail.com>';
const mwSender = 'DCCMS <metmalawi.gov.mw>';

const toForecast = (sender?: string, subject?: string) => ({ metadata: { sender, subject } }) as any;

describe('mapForecastType', () => {
  it('maps ZM lunchtime/evening reports to daily', () => {
    assertEquals(
      mapForecastType(toForecast(zmSender, 'ZAMBIA LUNCHTIME WEATHER REPORT: SUNDAY (01/11/2026)')),
      'daily',
    );
    assertEquals(
      mapForecastType(toForecast(zmSender, 'ZAMBIA EVENING WEATHER FORECAST: MONDAY (02/11/2026)')),
      'daily',
    );
    assertEquals(
      mapForecastType(toForecast(zmSender, 'FORECAST FOR THE AFTERNOON AND EVENING: TUESDAY (03/11/2026)')),
      'daily',
    );
  });

  it('maps ZM weekly bulletins to weekly', () => {
    assertEquals(
      mapForecastType(toForecast(zmSender, 'Weekly Weather bulletin-31st October to 6th November')),
      'weekly',
    );
    assertEquals(mapForecastType(toForecast(zmSender, '7 DAYS FORECAST')), 'weekly');
  });

  it('maps RFC 2047 encoded ZM weekly subject to weekly', () => {
    assertEquals(
      mapForecastType(
        toForecast(
          zmSender,
          '=?UTF-8?Q?=E2=80=8BWeekly_Weather_bulletin_=2D_03_to_9th_November=2C_202?=\r\n\t=?UTF-8?Q?6?=',
        ),
      ),
      'weekly',
    );
  });

  it('keeps MW five-day mapping and daily fallback', () => {
    assertEquals(
      mapForecastType(toForecast(mwSender, 'FIVE DAY WEATHER FORECAST -ISSUED ON 02nd NOVEMBER 2026')),
      'weekly',
    );
    assertEquals(
      mapForecastType(toForecast(mwSender, 'WEATHER FORECAST FOR TONIGHT AND TOMORROW 02ND NOVEMBER 2026')),
      'daily',
    );
  });

  it('falls back to daily when sender or subject is missing', () => {
    assertEquals(mapForecastType(toForecast(undefined, 'Weekly Weather bulletin')), 'daily');
    assertEquals(mapForecastType(toForecast(zmSender, undefined)), 'daily');
    assertEquals(mapForecastType(toForecast(zmSender, '')), 'daily');
  });

  it('does not leak keywords across senders', () => {
    // 'bulletin' keyword is scoped to the ZM sender only
    assertEquals(mapForecastType(toForecast(mwSender, 'Weekly Weather bulletin')), 'daily');
  });
});

describe('decodeMimeSubject', () => {
  it('decodes Q-encoded words', () => {
    assertEquals(
      decodeMimeSubject('=?UTF-8?Q?Weekly_Weather_bulletin_=2D_03_to_9th?='),
      'Weekly Weather bulletin - 03 to 9th',
    );
  });

  it('leaves plain subjects untouched', () => {
    assertEquals(decodeMimeSubject('ZAMBIA EVENING WEATHER FORECAST'), 'ZAMBIA EVENING WEATHER FORECAST');
  });
});
