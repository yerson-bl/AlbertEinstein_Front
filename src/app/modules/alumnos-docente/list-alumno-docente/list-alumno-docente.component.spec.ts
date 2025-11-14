import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListAlumnoDocenteComponent } from './list-alumno-docente.component';

describe('ListAlumnoDocenteComponent', () => {
  let component: ListAlumnoDocenteComponent;
  let fixture: ComponentFixture<ListAlumnoDocenteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListAlumnoDocenteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListAlumnoDocenteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
