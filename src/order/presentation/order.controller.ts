import { Controller, Get, Post, Body } from '@nestjs/common';
import { OrderService } from '../application/service/order.service';
import { plainToInstance } from 'class-transformer';
import {
  CancelOrderResponse,
  CardPaymentResponse,
  GetStatusResponse,
  InsertCashResponse,
  PurchaseDrinkResponse,
  ReturnCashResponse,
} from './dtos/order.response.dto';
import { ApiCreatedResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  CardPaymentRequest,
  InsertCashRequest,
  PurchaseRequest,
} from './dtos/order.request.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @ApiOperation({
    operationId: 'get-status',
    summary: '자판기 현재 상태 조회',
  })
  @ApiResponse({ type: GetStatusResponse })
  @Get('status')
  getStatus(): GetStatusResponse {
    const result = this.orderService.getStatus();

    return plainToInstance(GetStatusResponse, result);
  }

  @ApiOperation({
    operationId: 'insert-cash',
    summary: '자판기에 현금 투입',
  })
  @ApiCreatedResponse({ type: InsertCashResponse })
  @Post('insert-cash')
  insertCash(@Body() dto: InsertCashRequest): InsertCashResponse {
    const { amount } = dto;
    const result = this.orderService.insertCash(amount);

    return plainToInstance(InsertCashResponse, result);
  }

  @ApiOperation({
    operationId: 'insert-card',
    summary: '자판기에 카드 투입',
  })
  @ApiCreatedResponse({ type: CardPaymentResponse })
  @Post('insert-card')
  cardPayment(@Body() dto: CardPaymentRequest): CardPaymentResponse {
    const { cardNumber, amount } = dto;
    const result = this.orderService.processCardPayment(cardNumber, amount);

    return plainToInstance(CardPaymentResponse, result);
  }

  @ApiOperation({
    operationId: 'purchase-drink',
    summary: '음료 구매',
  })
  @ApiCreatedResponse({ type: PurchaseDrinkResponse })
  @Post('purchase')
  purchaseDrink(@Body() dto: PurchaseRequest): PurchaseDrinkResponse {
    const { drinkId } = dto;
    const result = this.orderService.purchaseDrink(drinkId);

    return plainToInstance(PurchaseDrinkResponse, result);
  }

  @ApiOperation({
    operationId: 'return-all-cash',
    summary: '잔돈 반환',
  })
  @ApiCreatedResponse({ type: ReturnCashResponse })
  @Post('return-cash')
  returnAllCash(): ReturnCashResponse {
    const result = this.orderService.returnAllCash();

    return plainToInstance(ReturnCashResponse, result);
  }

  @ApiOperation({
    operationId: 'cancel-order',
    summary: '주문 취소',
  })
  @ApiCreatedResponse({ type: CancelOrderResponse })
  @Post('cancel')
  cancelOrder(): CancelOrderResponse {
    const result = this.orderService.cancelOrder();

    return plainToInstance(CancelOrderResponse, result);
  }
}
