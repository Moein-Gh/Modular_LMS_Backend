import { Test, TestingModule } from '@nestjs/testing';
import { ApiUserController } from './api-user.controller';
import { ApiUserService } from './api-user.service';

describe('ApiUserController', () => {
  let apiUserController: ApiUserController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiUserController],
      providers: [ApiUserService],
    }).compile();

    apiUserController = app.get<ApiUserController>(ApiUserController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(apiUserController.getHello()).toBe('Hello World!');
    });
  });
});
