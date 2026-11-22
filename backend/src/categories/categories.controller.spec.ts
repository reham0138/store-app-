
import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { vi } from 'vitest';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const categoriesService = {
    findAll: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        {
          provide: CategoriesService,
          useValue: categoriesService,
        },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all categories', async () => {
    const result = [{ name: 'Food' }];
    categoriesService.findAll.mockResolvedValue(result);

    await expect(controller.findAll()).resolves.toEqual(result);
    expect(categoriesService.findAll).toHaveBeenCalled();
  });

  it('should create a category', async () => {
    const dto = { name: 'Food' };
    const result = { _id: '1', ...dto };
    categoriesService.create.mockResolvedValue(result);

    await expect(controller.create(dto as any)).resolves.toEqual(result);
    expect(categoriesService.create).toHaveBeenCalledWith(dto);
  });

  it('should return one category', async () => {
    const result = { _id: '123', name: 'Food' };
    categoriesService.findOne.mockResolvedValue(result);

    await expect(controller.findOne('123')).resolves.toEqual(result);
    expect(categoriesService.findOne).toHaveBeenCalledWith('123');
  });

  it('should update a category', async () => {
    const dto = { name: 'Drinks' };
    const result = { _id: '123', ...dto };
    categoriesService.update.mockResolvedValue(result);

    await expect(controller.update('123', dto as any)).resolves.toEqual(result);
    expect(categoriesService.update).toHaveBeenCalledWith('123', dto);
  });

  it('should delete a category', async () => {
    const result = { message: 'Category deleted' };
    categoriesService.remove.mockResolvedValue(result);

    await expect(controller.remove('123')).resolves.toEqual(result);
    expect(categoriesService.remove).toHaveBeenCalledWith('123');
  });
});
