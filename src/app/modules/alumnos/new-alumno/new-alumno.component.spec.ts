import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAlumnoComponent } from './new-alumno.component';

describe('NewAlumnoComponent', () => {
  let component: NewAlumnoComponent;
  let fixture: ComponentFixture<NewAlumnoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAlumnoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewAlumnoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
