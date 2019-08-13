import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangelogPage } from './changelog.page';

describe('ChangelogPage', () => {
  let component: ChangelogPage;
  let fixture: ComponentFixture<ChangelogPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangelogPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangelogPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
