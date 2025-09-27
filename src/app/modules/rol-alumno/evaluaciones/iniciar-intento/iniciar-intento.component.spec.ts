import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IniciarIntentoComponent } from './iniciar-intento.component';

describe('IniciarIntentoComponent', () => {
  let component: IniciarIntentoComponent;
  let fixture: ComponentFixture<IniciarIntentoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IniciarIntentoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IniciarIntentoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
