import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { FormViewPage } from "./formView.page";

describe("ViewPage", () => {
  let component: FormViewPage;
  let fixture: ComponentFixture<FormViewPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FormViewPage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormViewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
