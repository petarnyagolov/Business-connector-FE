import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserCompaniesComponent } from './user-companies.component';

describe('MyCompaniesComponent', () => {
  let component: UserCompaniesComponent;
  let fixture: ComponentFixture<UserCompaniesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserCompaniesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserCompaniesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
