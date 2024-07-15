import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { PICSAFormValidators } from '@picsa/forms';

import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceLinkRow } from '../../../types';

@Component({
  selector: 'dashboard-resource-link-edit',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resource-link-edit.component.html',
  styleUrl: './resource-link-edit.component.scss',
})
export class ResourceLinkEditComponent implements OnInit {
  constructor(
    private service: ResourcesDashboardService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) {}

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    type: ['link'],
    url: ['', PICSAFormValidators.isUrl],
  });
  async ngOnInit() {
    await this.service.ready();
    const { id } = this.route.snapshot.params;
    if (id) {
      const { data } = await this.service.tables.links.select<'*', IResourceLinkRow>('*').eq('id', id);
      const resource = data?.[0];
      if (resource) {
        this.populateResource(resource);
      }
    }
  }

  // TODO - handle success/error messages
  public async saveResource() {
    const values = this.form.getRawValue() as any;
    // Remove id entry if not populated
    if (values.id === null) {
      delete values.id;
    }
    const { data, error } = await this.service.tables.files.upsert(values);
    console.log({ data, error });
  }

  private populateResource(resource: any) {
    // this.resourceType = resource.type as any;
    // console.log('populate resource', resource);
    // switch (resource.type) {
    //   case 'file':
    //     this.fileForm.patchValue(resource);
    //     break;
    //   case 'link':
    //     this.linkForm.patchValue(resource);
    //     break;
    //   default:
    //     console.warn('Resource type not supported', resource.type);
    // }
  }
}
