import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IndustryService } from './industry.service';

describe('IndustryService', () => {
  let service: IndustryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [IndustryService]
    });
    service = TestBed.inject(IndustryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
