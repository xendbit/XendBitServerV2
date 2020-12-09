import { Test, TestingModule } from '@nestjs/testing';
import { MoneyWaveService } from './money-wave.service';

describe('MoneyWaveService', () => {
  let service: MoneyWaveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MoneyWaveService],
    }).compile();

    service = module.get<MoneyWaveService>(MoneyWaveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
