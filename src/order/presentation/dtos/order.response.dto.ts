import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Drink } from '../../application/interface/order.interface';

@Exclude()
export class GetStatusResponse {
  @ApiProperty({ example: 200 })
  @Expose()
  currentCashInput: number;

  @ApiProperty({ example: 200 })
  @Expose()
  currentCardAmount: number;

  @ApiProperty({
    example: '{ id: string, name: string, price: number, stock: number }',
  })
  @Expose()
  availableDrinks: Drink[];

  @ApiProperty({ example: '음료를 선택하거나 돈을 넣어주세요.' })
  @Expose()
  message: string;
}

@Exclude()
export class InsertCashResponse {
  @ApiProperty({ example: '... 현재 투입 금액 ...' })
  @Expose()
  message: string;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCashInput: number;
}

@Exclude()
export class CardPaymentResponse {
  @ApiProperty({ example: '... 카드 승인 완료 ...' })
  @Expose()
  message: string;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCardAmount: number;
}

@Exclude()
export class PurchaseDrinkResponse {
  @ApiProperty({ example: '... 지급 되었습니다 ...' })
  @Expose()
  message: string;

  @ApiProperty({ example: '... 지급 되었습니다 ...' })
  @Expose()
  purchasedDrink: Drink;

  @ApiProperty({ example: 100 })
  @Expose()
  change: number;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCashInput: number;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCardAmount: number;
}

@Exclude()
export class ReturnCashResponse {
  @ApiProperty({ example: '... 반환 되었습니다 ...' })
  @Expose()
  message: string;

  @ApiProperty({ example: 100 })
  @Expose()
  change: number;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCashInput: number;
}

@Exclude()
export class CancelOrderResponse {
  @ApiProperty({ example: '... 취소 되었습니다 ...' })
  @Expose()
  message: string;

  @ApiProperty({ example: 100 })
  @Expose()
  change: number;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCashInput: number;

  @ApiProperty({ example: 1000 })
  @Expose()
  currentCardAmount: number;
}
