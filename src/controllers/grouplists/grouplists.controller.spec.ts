import { Test, TestingModule } from '@nestjs/testing';
import { GrouplistsController } from './grouplists.controller';

describe('GrouplistsController', () => {
  let controller: GrouplistsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GrouplistsController],
    }).compile();

    controller = module.get<GrouplistsController>(GrouplistsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
