import { Drink } from '../application/interface/order.interface';
import { NotEnoughChangeException } from '../application/exception/order.service.exception';
import { Logger } from '@nestjs/common';

export class VendingMachine {
  private readonly logger = new Logger(VendingMachine.name);

  drinks: Drink[];
  currentCashInput: number = 0;
  currentCardAmount: number = 0;
  availableChange: { [key: number]: number } = {};
  readonly validCashList = [100, 500, 1000, 5000, 10000];

  constructor(
    initialDrinks: Drink[],
    initialChange: { [key: number]: number },
  ) {
    this.drinks = initialDrinks;
    this.availableChange = initialChange;
  }

  /**
   * 현금투입
   * @param amount
   */
  addCashInput(amount: number): void {
    this.currentCashInput += amount;
    // 잔돈으로 사용이 가능한 현금의 경우 잔동통에 추가
    if (this.validCashList.includes(amount)) {
      this.availableChange[amount] = (this.availableChange[amount] || 0) + 1;
    }
  }

  /**
   * 자판기 안 해당 음료의 재고 감소
   * @param drinkId
   */
  decreaseStock(drinkId: string): void {
    this.drinks.forEach((drink) => {
      if (drink.id === drinkId) {
        drink.stock--;
        // 현금 결제의 경우
        if (this.currentCashInput) {
          this.currentCashInput -= drink.price;
        } // 카드 결제의 경우
        else if (this.currentCardAmount) {
          // 딱 맞는 금액으로 결제되므로 0 으로 초기화
          this.currentCardAmount = 0;
        }
      }
    });
  }

  /**
   * 카드 결제 금액 설정
   * @param amount
   */
  setCardAmount(amount: number): void {
    this.currentCardAmount = amount;
  }

  /**
   * 현금투입금, 카드결제액 초기화
   */
  resetPayment(): void {
    this.currentCashInput = 0;
    this.currentCardAmount = 0;
  }

  /**
   * 잔돈 반환 로직
   * 그리디 알고리즘 사용
   * @param amountToReturn
   * @returns
   */
  returnChange(amountToReturn: number): number {
    let returnAmount = 0;
    // 내림차순 정리
    const sortedValidCashList = this.validCashList.sort((a, b) => b - a);

    for (const cash of sortedValidCashList) {
      if (amountToReturn <= 0) break;

      const numCoinsAvailable = this.availableChange[cash] || 0;
      if (numCoinsAvailable > 0) {
        // 거슬러 줄 화폐의 갯수
        const numToReturn = Math.min(
          Math.floor(amountToReturn / cash),
          numCoinsAvailable,
        );
        returnAmount += numToReturn * cash;
        amountToReturn -= numToReturn * cash;
        this.availableChange[cash] -= numToReturn;
      }
    }

    // 거슬러 줘야 할 돈이 남은 경우 -> 실패
    if (amountToReturn > 0) {
      this.logger.error(
        `잔돈 반환 실패: ${amountToReturn}원 부족. 현재 잔돈통:`,
        this.availableChange,
      );
      throw new NotEnoughChangeException(
        `거스름돈 ${amountToReturn}원 반환에 실패했습니다.`,
      );
    }

    // 투입 금액 초기화
    this.currentCashInput = 0;

    return returnAmount;
  }
}
