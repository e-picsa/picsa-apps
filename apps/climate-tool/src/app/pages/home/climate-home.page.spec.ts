import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClimateHomePage } from './climate-home.page';

describe('ClimateHomePage', () => {
  let component: ClimateHomePage;
  let fixture: ComponentFixture<ClimateHomePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ClimateHomePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClimateHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
