import { IsInt, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InsertCashRequest {
  @ApiProperty({ example: 1000 })
  @IsInt()
  @IsNotEmpty()
  amount: number;
}

export class CardPaymentRequest {
  @ApiProperty({ example: 'ABCD-EFGH-IJKL-MNOP' })
  @IsString()
  @IsNotEmpty()
  cardNumber: string;

  @ApiProperty({ example: 1000 })
  @IsInt()
  @IsNotEmpty()
  amount: number;
}

export class PurchaseRequest {
  @ApiProperty({ example: 'cola' })
  @IsString()
  @IsNotEmpty()
  drinkId: string;
}
