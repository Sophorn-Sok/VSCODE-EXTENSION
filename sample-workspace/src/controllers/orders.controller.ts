import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('orders')
export class OrdersController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() { itemId, quantity }: { itemId: string; quantity: number }) {
    return { itemId, quantity };
  }
}
