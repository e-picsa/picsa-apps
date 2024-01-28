# Form Base Components

The base components are designed to make it easier to implement custom form value controls.

Base components are designed to be inherited, providing any array of `selectOptions` where each entry contains a unique `id` property

For example, the base select component can be extended to create a custom select component

```ts
import { PicsaFormBaseSelectComponent } from '@picsa/shared/modules/forms/components/base/select';

const SELECT_OPTIONS = [{id:'1',label:'hello'}, {id:'2',label:'world'}]

@Component({
  selector: 'my-select-component',
  templateUrl: './my-select-componetn.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySelectComponent extends PicsaFormBaseSelectComponent<typeof SELECT_OPTIONS[0]>{
     constructor(cdr:ChangeDetectorRef, ){
        super(cdr,SELECT_OPTIONS)
     }
```

and used to render the options within a html component. The `selected` variable can be used to set or get the id of
the option that has been selected. The full item can be retrieved via `selectedOption`

```html
@for(option of selectOptions){
<div (click)="selected = option.id">....</div>
}
<div>Selected option: {{selectedOption.label}}</div>
```

The process for extending multiple select base is mostly the same, with the exception of a `toggleSelected` method used instead of explicitly setting selected option

```html
@for(option of selectOptions){
<div (click)="toggleSelected(option.id)">....</div>
}
```

In order to use with angular forms an additional accessor should be added to the component provider

```ts
export const CONTROL_VALUE_ACCESSOR: Provider = {
   provide: NG_VALUE_ACCESSOR,
   useExisting: forwardRef(() => MySelectComponent),
   multi: true,
};
@Component({
  ...
  providers: [CONTROL_VALUE_ACCESSOR],
})
```

**Optimisation**
The form will by default create a hashmap of option entries for lookup purposes. If the same component will be used
in multiple locations it may be beneficial to directly override the `selectOptionsHashmap` to avoid recalculation

```ts
export class MySelectComponent extends PicsaFormBaseSelectComponent<typeof SELECT_OPTIONS[0]>{
     constructor(cdr:ChangeDetectorRef, ){
        super(cdr,SELECT_OPTIONS, SELECT_OPTIONS_HASHMAP)
     }
```

**Further Reading**
For more information about custom value controllers see:

- https://valor-software.com/articles/avoiding-common-pitfalls-with-controlvalueaccessors-in-angular

- https://sreyaj.dev/custom-form-controls-controlvalueaccessor-in-angular

- https://indepth.dev/posts/1055/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms
