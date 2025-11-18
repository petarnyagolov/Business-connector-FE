import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserResponsesComponent } from './user-responses.component';

describe('UserResponsesComponent', () => {
  let component: UserResponsesComponent;
  let fixture: ComponentFixture<UserResponsesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserResponsesComponent, HttpClientTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserResponsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
