import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewAlumnoDocenteComponent } from './new-alumno-docente.component';

describe('NewAlumnoDocenteComponent', () => {
  let component: NewAlumnoDocenteComponent;
  let fixture: ComponentFixture<NewAlumnoDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewAlumnoDocenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewAlumnoDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
