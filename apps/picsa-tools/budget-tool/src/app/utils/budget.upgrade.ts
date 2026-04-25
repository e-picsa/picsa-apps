import { MONTH_DATA } from '@picsa/data';
import { APP_VERSION } from '@picsa/environments/src/version';

import { BUDGET_CARDS } from '../data';
import { IBudget, IBudgetMeta, IBudgetPeriodData, IEnterpriseScaleLentgh } from '../models/budget-tool.models';
import { IBudgetCard, IBudgetCardWithValues } from '../schema';

export const BUDGET_API_VERSION = 5;

type LegacyBudgetPeriodCard = {
  id?: string;
  name?: string;
  label?: string;
  quantity?: number | string;
  cost?: number | string;
  total?: number | string;
  people?: number | string;
  days?: number | string;
  consumed?: number | string;
  imgType?: 'png' | 'svg';
};

type LegacyBudgetPeriod = {
  activities?: Record<string, LegacyBudgetPeriodCard>;
  inputs?: Record<string, LegacyBudgetPeriodCard>;
  outputs?: Record<string, LegacyBudgetPeriodCard>;
  familyLabour?: Record<string, LegacyBudgetPeriodCard>;
  produceConsumed?: Record<string, LegacyBudgetPeriodCard>;
};

type BudgetLike = Partial<IBudget> & {
  apiVersion?: number;
  data?: IBudget['data'] | Record<string, LegacyBudgetPeriod>;
  meta?: Partial<IBudgetMeta>;
  periods?: {
    labels?: string[];
    starting?: string;
    scale?: string;
    total?: number | string;
  };
  title?: string;
  description?: string;
  enterpriseType?: string;
  enterprise?: IBudgetCard | null;
  shareCode?: string;
  dotValues?: unknown;
};

const PERIOD_TYPES = ['activities', 'inputs', 'outputs', 'familyLabour', 'produceConsumed'] as const;

export const checkForBudgetUpgrades = (budget: IBudget) => upgradeBudget(budget);

export const upgradeBudget = (budget: BudgetLike): IBudget => {
  const clonedBudget = JSON.parse(JSON.stringify(budget ?? {})) as BudgetLike;
  if (isCurrentBudgetShape(clonedBudget)) {
    return normalizeCurrentBudget(clonedBudget);
  }
  return normalizeLegacyBudget(clonedBudget);
};

function isCurrentBudgetShape(budget: BudgetLike): budget is IBudget {
  return Array.isArray(budget.data) && !!budget.meta;
}

function normalizeCurrentBudget(budget: IBudget & BudgetLike): IBudget {
  const enterprise = normalizeEnterpriseCard(budget);
  const meta = budget.meta ?? {};
  const data = (budget.data ?? []).map((period) => normalizeCurrentPeriod(period));

  return {
    ...budget,
    apiVersion: BUDGET_API_VERSION,
    _appVersion: budget._appVersion ?? APP_VERSION,
    _key: budget._key ?? '',
    _created: budget._created ?? new Date().toISOString(),
    _modified: budget._modified ?? budget._created ?? new Date().toISOString(),
    data,
    meta: {
      ...meta,
      title: meta.title ?? budget.title ?? '',
      description: meta.description ?? budget.description ?? '',
      enterprise,
      lengthScale: normalizeLengthScale(meta.lengthScale ?? budget.periods?.scale),
      lengthTotal: normalizeNumber(meta.lengthTotal ?? budget.periods?.total ?? data.length),
      monthStart: normalizeMonthStart(meta.monthStart, budget.periods),
      valueScale: normalizeNumber(meta.valueScale ?? 1, 1),
    },
  };
}

function normalizeLegacyBudget(budget: BudgetLike): IBudget {
  const legacyPeriods = !Array.isArray(budget.data) && budget.data ? budget.data : {};
  const periodKeys = Object.keys(legacyPeriods).sort((left, right) => normalizeNumber(left) - normalizeNumber(right));
  const declaredTotal = normalizeNumber(budget.periods?.total ?? periodKeys.length, periodKeys.length);
  const periodCount = Math.max(periodKeys.length, declaredTotal);
  const data = new Array(periodCount).fill(undefined).map((_, index) => {
    const periodKey = periodKeys[index] ?? String(index);
    const period = legacyPeriods[periodKey as keyof typeof legacyPeriods] as LegacyBudgetPeriod | undefined;
    return normalizeLegacyPeriod(period, budget);
  });

  return {
    ...budget,
    apiVersion: BUDGET_API_VERSION,
    _appVersion: budget._appVersion ?? APP_VERSION,
    _key: budget._key ?? '',
    _created: budget._created ?? new Date().toISOString(),
    _modified: budget._modified ?? budget._created ?? new Date().toISOString(),
    data,
    meta: {
      title: budget.meta?.title ?? budget.title ?? '',
      description: budget.meta?.description ?? budget.description ?? '',
      enterprise: normalizeEnterpriseCard(budget),
      lengthScale: normalizeLengthScale(budget.meta?.lengthScale ?? budget.periods?.scale),
      lengthTotal: periodCount,
      monthStart: normalizeMonthStart(budget.meta?.monthStart, budget.periods),
      valueScale: normalizeNumber(budget.meta?.valueScale ?? 1, 1),
    },
  };
}

function normalizeCurrentPeriod(period: Partial<IBudgetPeriodData>): IBudgetPeriodData {
  return {
    activities: normalizeCurrentCards(period.activities),
    inputs: normalizeCurrentCards(period.inputs),
    outputs: normalizeCurrentCards(period.outputs),
    familyLabour: normalizeCurrentCards(period.familyLabour),
    produceConsumed: normalizeCurrentCards(period.produceConsumed),
  };
}

function normalizeCurrentCards(cards?: IBudgetCardWithValues[]) {
  return (cards ?? []).map((card) => (card.values ? card : { ...card, values: defaultCardValues() }));
}

function normalizeLegacyPeriod(period: LegacyBudgetPeriod | undefined, budget: BudgetLike): IBudgetPeriodData {
  const currentPeriod = period ?? {};
  const activities = normalizeLegacyCards(currentPeriod.activities, 'activities', budget);
  const inputs = normalizeLegacyCards(currentPeriod.inputs, 'inputs', budget);
  const outputs = normalizeLegacyCards(currentPeriod.outputs, 'outputs', budget);
  const familyLabour = normalizeLegacyCards(currentPeriod.familyLabour, 'familyLabour', budget);
  const produceConsumed = normalizeLegacyCards(currentPeriod.produceConsumed, 'produceConsumed', budget);

  return {
    activities,
    inputs,
    outputs,
    familyLabour,
    produceConsumed:
      produceConsumed.length > 0 ? produceConsumed : normalizeDerivedProduceConsumed(currentPeriod.outputs, budget),
  };
}

function normalizeLegacyCards(
  cards: Record<string, LegacyBudgetPeriodCard> | undefined,
  periodType: (typeof PERIOD_TYPES)[number],
  budget: BudgetLike,
): IBudgetCardWithValues[] {
  return Object.values(cards ?? {}).map((card) => normalizeLegacyCard(card, periodType, budget));
}

function normalizeDerivedProduceConsumed(
  cards: Record<string, LegacyBudgetPeriodCard> | undefined,
  budget: BudgetLike,
): IBudgetCardWithValues[] {
  return Object.values(cards ?? [])
    .map((card) => {
      const consumed = normalizeNumber(card.consumed ?? card.quantity ?? 0);
      if (!consumed) {
        return undefined;
      }
      return normalizeLegacyCard(card, 'produceConsumed', budget, consumed);
    })
    .filter((card): card is IBudgetCardWithValues => !!card);
}

function normalizeLegacyCard(
  card: LegacyBudgetPeriodCard,
  periodType: (typeof PERIOD_TYPES)[number],
  budget: BudgetLike,
  quantityOverride?: number,
): IBudgetCardWithValues {
  const catalogCard = resolveCatalogCard(card, periodType, budget);
  const id = card.id ?? catalogCard?.id ?? periodType;
  const label = card.name ?? card.label ?? catalogCard?.label ?? id;

  return {
    ...(catalogCard ?? {}),
    id,
    label,
    type: periodType,
    imgType: catalogCard?.imgType ?? card.imgType ?? 'svg',
    values: normalizeLegacyValues(card, periodType, quantityOverride),
  };
}

function normalizeLegacyValues(
  card: LegacyBudgetPeriodCard,
  periodType: (typeof PERIOD_TYPES)[number],
  quantityOverride?: number,
): IBudgetCardWithValues['values'] {
  if (periodType === 'activities') {
    return defaultCardValues();
  }

  if (periodType === 'familyLabour') {
    return {
      quantity: normalizeNumber(quantityOverride ?? card.days ?? card.quantity ?? card.people),
      cost: 0,
      total: 0,
    };
  }

  if (periodType === 'produceConsumed') {
    return {
      quantity: normalizeNumber(quantityOverride ?? card.consumed ?? card.quantity),
      cost: 0,
      total: 0,
    };
  }

  const quantity = normalizeNumber(card.quantity);
  const cost = normalizeNumber(card.cost);
  const total = card.total !== undefined ? normalizeNumber(card.total) : quantity * cost;

  return {
    quantity,
    cost,
    total,
  };
}

function defaultCardValues(): IBudgetCardWithValues['values'] {
  return { quantity: 0, cost: 0, total: 0 };
}

function resolveCatalogCard(
  card: LegacyBudgetPeriodCard,
  periodType: (typeof PERIOD_TYPES)[number],
  budget: BudgetLike,
): IBudgetCard | undefined {
  const id = card.id?.trim();
  const normalizedLabel = (card.name ?? card.label ?? '').trim().toLowerCase();
  const searchPool = BUDGET_CARDS.filter((candidate) => {
    if (periodType === 'produceConsumed') {
      return candidate.type === 'outputs';
    }
    if (periodType === 'familyLabour') {
      return candidate.id === 'family-labour' || candidate.label === 'family labour';
    }
    return candidate.type === periodType;
  });

  const byId = id
    ? (searchPool.find((candidate) => candidate.id === id) ?? BUDGET_CARDS.find((candidate) => candidate.id === id))
    : undefined;
  if (byId) {
    return byId;
  }

  if (normalizedLabel) {
    return searchPool.find((candidate) => candidate.label.toLowerCase() === normalizedLabel);
  }

  return searchPool[0] ?? BUDGET_CARDS.find((candidate) => candidate.id === id);
}

function normalizeEnterpriseCard(budget: BudgetLike): IBudgetCard {
  const currentEnterprise = budget.meta?.enterprise ?? budget.enterprise;
  if (isBudgetCard(currentEnterprise)) {
    const catalogEnterprise = BUDGET_CARDS.find(
      (card) => card.type === 'enterprise' && card.id === currentEnterprise.id,
    );
    if (catalogEnterprise) {
      return catalogEnterprise;
    }
    return {
      ...currentEnterprise,
      type: 'enterprise',
      imgType: currentEnterprise.imgType ?? 'svg',
    };
  }

  const enterpriseGroup = resolveEnterpriseGroup(budget);
  const enterpriseCards = BUDGET_CARDS.filter(
    (card) => card.type === 'enterprise' && card.groupings?.includes(enterpriseGroup as any),
  );
  const searchText = `${budget.meta?.title ?? budget.title ?? ''} ${budget._key ?? ''}`.toLowerCase();
  const byLabel = enterpriseCards.find(
    (card) => searchText.includes(card.label.toLowerCase()) || searchText.includes(card.id.toLowerCase()),
  );

  return (
    byLabel ??
    enterpriseCards[0] ??
    BUDGET_CARDS.find((card) => card.type === 'enterprise') ?? {
      id: 'enterprise',
      label: 'enterprise',
      type: 'enterprise',
      imgType: 'svg',
      groupings: [enterpriseGroup as any],
    }
  );
}

function resolveEnterpriseGroup(budget: BudgetLike) {
  const groupCandidates = [
    budget.enterpriseType,
    budget.meta?.enterprise?.groupings?.[0],
    budget.enterprise?.groupings?.[0],
  ];

  for (const candidate of groupCandidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const normalized = candidate.toLowerCase();
    if (normalized === 'crop' || normalized === 'livestock' || normalized === 'livelihood' || normalized === 'fruits') {
      return normalized;
    }
    const catalogEnterprise = BUDGET_CARDS.find((card) => card.type === 'enterprise' && card.id === normalized);
    if (catalogEnterprise?.groupings?.[0]) {
      return catalogEnterprise.groupings[0];
    }
  }

  return 'crop';
}

function normalizeLengthScale(scale: string | undefined | null): IEnterpriseScaleLentgh {
  const normalized = scale?.toLowerCase();
  if (normalized === 'weeks' || normalized === 'months' || normalized === 'days') {
    return normalized;
  }
  return 'months';
}

function normalizeMonthStart(monthStart: number | undefined, periods?: BudgetLike['periods']) {
  if (typeof monthStart === 'number' && monthStart > 0) {
    return monthStart;
  }

  const startingMonth = periods?.starting?.trim();
  if (startingMonth) {
    const index = MONTH_DATA.findIndex((month) => month.labelShort.toLowerCase() === startingMonth.toLowerCase());
    if (index >= 0) {
      return index + 1;
    }
  }

  return 1;
}

function normalizeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isBudgetCard(card: unknown): card is IBudgetCard {
  return (
    !!card &&
    typeof card === 'object' &&
    typeof (card as IBudgetCard).id === 'string' &&
    typeof (card as IBudgetCard).label === 'string'
  );
}
