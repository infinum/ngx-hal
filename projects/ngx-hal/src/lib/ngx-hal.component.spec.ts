import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxHalComponent } from './ngx-hal.component';

describe('NgxHalComponent', () => {
  let component: NgxHalComponent;
  let fixture: ComponentFixture<NgxHalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NgxHalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxHalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
