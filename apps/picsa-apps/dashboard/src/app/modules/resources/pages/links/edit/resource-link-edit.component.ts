import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { PICSAFormValidators } from '@picsa/forms';

import { DashboardAuthService } from '../../../../auth/services/auth.service';
import { DeploymentDashboardService } from '../../../../deployment/deployment.service';
import { ResourcesDashboardService } from '../../../resources.service';
import { IResourceLinkRow } from '../../../types';

@Component({
  selector: 'dashboard-resource-link-edit',
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule, FormsModule],
  templateUrl: './resource-link-edit.component.html',
  styleUrl: './resource-link-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceLinkEditComponent implements OnInit {
  private service = inject(ResourcesDashboardService);
  private formBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private deploymentService = inject(DeploymentDashboardService);
  private authService = inject(DashboardAuthService);

  public isCreate = signal(false);
  private resourceOwner = signal<string | null>(null);

  public canEdit = computed(() => {
    if (this.authService.hasRole('resources.admin')) {
      return true;
    }
    if (this.authService.hasRole('resources.editor')) {
      if (this.isCreate()) return true;
      const owner = this.resourceOwner();
      const userId = this.authService.authUserId();
      return Boolean(owner && userId && owner === userId);
    }
    return false;
  });

  public form = this.formBuilder.group({
    id: new FormControl<string | null>(null),
    type: ['link'],
    url: ['', PICSAFormValidators.isUrl],
    country_code: [this.deploymentService.activeDeploymentCountry() as string, Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.canEdit()) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });
  }

  async ngOnInit() {
    const { id } = this.route.snapshot.params;
    this.isCreate.set(!id || id === 'create');
    await this.service.ready();
    if (id && id !== 'create') {
      const { data } = await this.service.tables.links.select<'*', IResourceLinkRow>('*').eq('id', id);
      const resource = data?.[0];
      if (resource) {
        this.resourceOwner.set(resource.owner);
        this.populateResource(resource);
      }
    }
  }

  // TODO - handle success/error messages
  public async saveResource() {
    if (!this.canEdit()) return;
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
