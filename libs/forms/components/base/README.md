# Form Base Components

The base components are designed to make it easier to implement custom form value controls utilizing modern Angular 21 Signal forms architecture via the `FormValueControl` approach.

Base components are designed to be inherited, providing an array of `selectOptions` where each entry contains a unique `id` property.

## Usage

Extend the base select component to create a custom standalone select component:

```ts
import { PicsaFormBaseSelectComponent } from '@picsa/forms/components/base/select';

const SELECT_OPTIONS = [{id:'1',label:'hello'}, {id:'2',label:'world'}]

@Component({
  selector: 'my-select-component',
  standalone: true,
  imports: [CommonModule], // Add necessary imports
  templateUrl: './my-select-component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySelectComponent extends PicsaFormBaseSelectComponent<typeof SELECT_OPTIONS[0]>{
     constructor(){
        super();
        this.initBase(SELECT_OPTIONS);
     }
}
```

### Template Interaction

Since `value` is a `model()` signal, interaction in the template uses Signal syntax or standard binding.

```html
@for(option of filteredOptions()){
  <div (click)="value.set(option.id)">....</div>
}

@if(selectedOption()) {
  <div>Selected option: {{selectedOption()?.label}}</div>
}
```

### Multiple Select

The process for extending multiple select base is similar. `value` is a signal containing an array. Use `toggleSelected` or `value.update()` to modify state.

```html
@for(option of filteredOptions()){
  <div (click)="toggleSelected(option.id)">....</div>
}
```

## Form Integration

Since these components now rely on modern Signal API with `FormValueControl` capabilities, you do **not** need to manually define `NG_VALUE_ACCESSOR` or `MatFormFieldControl`. The `value` model binding will do all the work implicitly for modern signal forms.

```ts
@Component({
  ...
  // NO PROVIDERS REQUIRED
})
```

**Optimization**
The base class will by default create a hashmap of option entries for lookup purposes. If the same component will be used in multiple locations, it is beneficial to provide the `selectOptionsHashmap` directly to `this.initBase` to avoid recalculation.

```ts
export class MySelectComponent extends PicsaFormBaseSelectComponent<typeof SELECT_OPTIONS[0]>{
     constructor(){
        super()
        this.initBase(SELECT_OPTIONS, SELECT_OPTIONS_HASHMAP)
     }
}
```
