import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { RequestDetailsComponent } from './request-details.component';
import { CompanyRequestService } from '../../service/company-request.service';
import { CompanyService } from '../../service/company.service';

describe('RequestDetailsComponent', () => {
  let component: RequestDetailsComponent;
  let fixture: ComponentFixture<RequestDetailsComponent>;

  const mockActivatedRoute = {
    params: of({ id: '123' }),
    snapshot: {
      params: { id: '123' },
      paramMap: {
        get: (key: string) => key === 'id' ? '123' : null
      }
    }
  };

  const mockCompanyRequestService = jasmine.createSpyObj('CompanyRequestService', ['getRequestById']);
  const mockCompanyService = jasmine.createSpyObj('CompanyService', ['getAllCompaniesByUser']);

  beforeEach(async () => {
    mockCompanyRequestService.getRequestById.and.returnValue(of({
      request: {
        id: '123',
        title: 'Test Request',
        requesterCompanyId: 'company1',
        requesterName: 'Test Company',
        requestType: 'service',
        description: 'Test Description',
        status: 'active',
        availableFrom: new Date(),
        availableTo: new Date(),
        pictures: [],
        requiredFields: []
      },
      responses: []
    }));
    mockCompanyService.getAllCompaniesByUser.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RequestDetailsComponent, HttpClientTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: CompanyRequestService, useValue: mockCompanyRequestService },
        { provide: CompanyService, useValue: mockCompanyService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
