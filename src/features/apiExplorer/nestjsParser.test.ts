import { parseNestJsRoutes } from './nestjsParser';

describe('parseNestJsRoutes', () => {
  it('combines the controller prefix with the method path', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Get(':id')
  findOne() {}

  @Post()
  create() {}
}
`;
    const endpoints = parseNestJsRoutes(source, 'users.controller.ts');

    expect(endpoints).toHaveLength(2);
    expect(endpoints[0]).toMatchObject({ method: 'GET', path: '/users/:id', framework: 'nestjs' });
    expect(endpoints[1]).toMatchObject({ method: 'POST', path: '/users' });
  });

  it('handles a controller with no prefix', () => {
    const source = `
@Controller()
export class HealthController {
  @Get('health')
  check() {}
}
`;
    const endpoints = parseNestJsRoutes(source, 'health.controller.ts');

    expect(endpoints).toEqual([expect.objectContaining({ method: 'GET', path: '/health' })]);
  });

  it('does not leak routes across two separate controllers in the same file', () => {
    const source = `
@Controller('a')
export class AController {
  @Get('one')
  one() {}
}

@Controller('b')
export class BController {
  @Get('two')
  two() {}
}
`;
    const endpoints = parseNestJsRoutes(source, 'controllers.ts');

    expect(endpoints.map((e) => e.path)).toEqual(['/a/one', '/b/two']);
  });

  it('extracts destructured @Body() fields', () => {
    const source = `
@Controller('users')
export class UsersController {
  @Post()
  create(@Body() { name, email }) {}
}
`;
    const endpoints = parseNestJsRoutes(source, 'users.controller.ts');

    expect(endpoints[0].bodyFields.map((f) => f.name).sort()).toEqual(['email', 'name']);
  });

  it('does not leak a later method\'s @Body() fields into an earlier method with no body', () => {
    const source = `
@Controller('orders')
export class OrdersController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne() {
    return {};
  }

  @Post()
  create(@Body() { itemId, quantity }) {}
}
`;
    const endpoints = parseNestJsRoutes(source, 'orders.controller.ts');

    expect(endpoints).toHaveLength(3);
    expect(endpoints[0]).toMatchObject({ method: 'GET', path: '/orders', bodyFields: [] });
    expect(endpoints[1]).toMatchObject({ method: 'GET', path: '/orders/:id', bodyFields: [] });
    expect(endpoints[2].bodyFields.map((f) => f.name).sort()).toEqual(['itemId', 'quantity']);
  });

  it('returns an empty array for a file with no @Controller decorator', () => {
    const source = 'export class PlainService {}';
    expect(parseNestJsRoutes(source, 'plain.service.ts')).toEqual([]);
  });
});
