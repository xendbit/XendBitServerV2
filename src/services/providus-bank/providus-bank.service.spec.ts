import { Test, TestingModule } from '@nestjs/testing';
import { ProvidusBankService } from './providus-bank.service';

describe('ProvidusBankService', () => {
  let service: ProvidusBankService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvidusBankService],
    }).compile();

    service = module.get<ProvidusBankService>(ProvidusBankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
