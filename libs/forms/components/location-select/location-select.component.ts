import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { ICountryCode } from '@picsa/data';
import {
  GeoToolKey,
  getGeoLocationData,
  IGeoLayer,
  IGeolocationData,
  IGeoLocationItem,
  ILocationSelection,
} from '@picsa/data/geoLocation';
import { isEqual } from '@picsa/utils/object.utils';

interface ILayerRow {
  layer: IGeoLayer;
  index: number;
  options: IGeoLocationItem[];
  selectedId: string | undefined;
  disabled: boolean;
}

/**
 * Location select displays dropdowns for each administrative/agricultural tier configured
 * for the country (1, 2, or N layers), optionally capped to a tool's target layer.
 */
@Component({
  selector: 'picsa-form-location-select',
  imports: [CommonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './location-select.component.html',
  styleUrl: './location-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormLocationSelectComponent {
  public countryCode = input.required<string>();
  public value = input<ILocationSelection>({});
  /** Optional tool scope; caps rendered dropdowns to the layer configured for that tool */
  public tool = input<GeoToolKey | undefined>(undefined);
  /** Optional method to filter locations before rendering */
  public locationModifier = input<(data: IGeolocationData, countryCode: string) => IGeolocationData>((data) => data);

  public valueChanged = output<ILocationSelection>();

  public readonly layerSelects = viewChildren<MatSelect>('layerSelect');
  public selectedByLayer = signal<ILocationSelection>({}, { equal: isEqual });

  public locationData = computed<IGeolocationData>(() =>
    this.locationModifier()(getGeoLocationData(this.countryCode() as ICountryCode), this.countryCode()),
  );

  public visibleLayers = computed<IGeoLayer[]>(() => {
    const data = this.locationData();
    const tool = this.tool();
    if (!tool) return data.layers;
    const targetKey = data.toolLayers[tool];
    const idx = data.layers.findIndex((l) => l.key === targetKey);
    return idx >= 0 ? data.layers.slice(0, idx + 1) : [];
  });

  public layerRows = computed<ILayerRow[]>(() => {
    const layers = this.visibleLayers();
    const selected = this.selectedByLayer();
    return layers.map((layer, index) => {
      if (index === 0) {
        return { layer, index, options: layer.locations, selectedId: selected[layer.key], disabled: false };
      }
      const parentKey = layer.parentLayer ?? layers[index - 1].key;
      const parentId = selected[parentKey];
      const options = parentId ? layer.locations.filter((o) => o.parentId === parentId) : [];
      return { layer, index, options, selectedId: selected[layer.key], disabled: !parentId };
    });
  });

  public isValid = computed(() => {
    const layers = this.visibleLayers();
    if (layers.length === 0) return false;
    const selected = this.selectedByLayer();
    return layers.every((layer) => Boolean(selected[layer.key]));
  });

  /** Deepest selected location id across visible layers */
  public deepestSelectedId = computed(() => {
    const layers = this.visibleLayers();
    const selected = this.selectedByLayer();
    for (let i = layers.length - 1; i >= 0; i--) {
      const id = selected[layers[i].key];
      if (id) return id;
    }
    return undefined;
  });

  constructor() {
    // Seed from external `value` input when it changes (without resetting on unrelated layer updates)
    effect(() => {
      const inputValue = this.value();
      const layers = untracked(() => this.visibleLayers());
      this.selectedByLayer.set(this.reconcileSelection(layers, inputValue ?? {}));
    });

    // Re-reconcile if country or tool changes visible layers
    effect(() => {
      const layers = this.visibleLayers();
      const current = untracked(() => this.selectedByLayer());
      this.selectedByLayer.set(this.reconcileSelection(layers, current));
    });

    let lastEmitted: ILocationSelection | undefined = undefined;
    effect(() => {
      const current = this.selectedByLayer();
      const hasAny = Object.keys(current).length > 0;
      const hadAny = lastEmitted ? Object.keys(lastEmitted).length > 0 : false;
      if (!isEqual(current, lastEmitted) && (hasAny || hadAny)) {
        lastEmitted = current;
        this.valueChanged.emit(current);
      }
    });
  }

  public onLayerSelectionChange(layerIndex: number, newValue: string | undefined) {
    const layers = this.visibleLayers();
    const current = this.selectedByLayer();
    const candidate: ILocationSelection = {};
    for (let i = 0; i < layerIndex; i++) {
      const key = layers[i].key;
      if (current[key]) candidate[key] = current[key];
    }
    if (layers[layerIndex] && newValue) {
      candidate[layers[layerIndex].key] = newValue;
    }

    const reconciled = this.reconcileSelection(layers, candidate);
    this.selectedByLayer.set(reconciled);

    const nextIndex = layerIndex + 1;
    const nextLayer = layers[nextIndex];
    if (newValue && nextLayer && !reconciled[nextLayer.key]) {
      setTimeout(() => {
        const nextRow = this.layerRows()[nextIndex];
        if (nextRow && nextRow.options.length > 1 && !nextRow.selectedId) {
          this.layerSelects()[nextIndex]?.open();
        }
      });
    }
  }

  private reconcileSelection(layers: IGeoLayer[], candidate: ILocationSelection): ILocationSelection {
    const result: ILocationSelection = {};
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      let options = layer.locations;
      if (i > 0) {
        const parentKey = layer.parentLayer ?? layers[i - 1].key;
        const parentId = result[parentKey];
        if (!parentId) break;
        options = layer.locations.filter((o) => o.parentId === parentId);
      }
      const candidateId = candidate[layer.key];
      if (candidateId && options.some((o) => o.id === candidateId)) {
        result[layer.key] = candidateId;
      } else if (i > 0 && options.length === 1) {
        result[layer.key] = options[0].id;
      } else {
        break;
      }
    }
    return result;
  }
}
