import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesPage } from './resources.page';

describe('ResourcesPage', () => {
  let component: ResourcesPage;
  let fixture: ComponentFixture<ResourcesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourcesPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourcesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
