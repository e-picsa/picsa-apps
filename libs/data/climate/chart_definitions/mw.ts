import DEFAULT_DEFINITIONS from './default';

const definitions = DEFAULT_DEFINITIONS();

definitions.extreme_rainfall_days.keys = ['sum_RD50' as any];
definitions.extreme_rainfall_days.definition = 'Rainy days with at least 50mm';

// Provide country-specific overrides for definitions and labels

export default definitions;
