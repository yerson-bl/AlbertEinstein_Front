import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewSeccionComponent } from './new-seccion.component';

describe('NewSeccionComponent', () => {
  let component: NewSeccionComponent;
  let fixture: ComponentFixture<NewSeccionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewSeccionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewSeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
