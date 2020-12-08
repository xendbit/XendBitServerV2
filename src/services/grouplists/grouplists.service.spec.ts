import { Test, TestingModule } from '@nestjs/testing';
import { GrouplistsService } from './grouplists.service';

describe('GrouplistsService', () => {
  let service: GrouplistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GrouplistsService],
    }).compile();

    service = module.get<GrouplistsService>(GrouplistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
