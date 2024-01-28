# Form Base Components

The base components are designed to make it easier to implement custom form value controls.

Base components are designed to be inherited, providing any array of `selectOptions` where each entry contains a unique `id` property, and then a `selectOptionsHashmap` which contains the same data organised by id.

For example, the base select component can be extended to create a custom select component

```ts
@Component({
  selector: 'my-select-component',
  templateUrl: './my-select-componetn.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MySelectComponent extends PicsaFormBaseSelectComponent<ISelectType>{
     public selectOptions = [...]
     public selectOptionsHashmap = {...}

     constructor(cdr:ChangeDetectorRef){
        super(cdr)
     }
```

and used to render the options within a html component

```html
@for(option of selectOptions){
<div (click)="selected = option.id">....</div>
}
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
  providers: [CONTROL_VALUE_ACCESSOR],
})
```

For more information about custom value controllers see:

- https://valor-software.com/articles/avoiding-common-pitfalls-with-controlvalueaccessors-in-angular

- https://sreyaj.dev/custom-form-controls-controlvalueaccessor-in-angular

- https://indepth.dev/posts/1055/never-again-be-confused-when-implementing-controlvalueaccessor-in-angular-forms
