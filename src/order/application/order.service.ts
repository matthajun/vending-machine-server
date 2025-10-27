import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  VendingMachineStatus,
  TransactionResult,
  Drink,
} from './interface/order.interface';
import {
  InvalidMoneyException,
  InsufficientFundsException,
  OutOfStockException,
  InvalidSelectionException,
  PaymentFailedException,
} from './exception/order.service.exception';
import { VendingMachine } from '../domain/vending-machine';

@Injectable()
export class OrderService implements OnModuleInit {
  private readonly logger = new Logger(OrderService.name);

  // 앱이 실행될 때 마다 하나의 인스턴스만 생성한다. (싱글톤 패턴)
  private vendingMachine: VendingMachine;

  // 앱이 실행될 때 생성한 vendingMachine 인스턴스를 초기화한다.
  onModuleInit(): void {
    // 초기 재고
    const initialDrinks: Drink[] = [
      { id: 'cola', name: '콜라', price: 1100, stock: 5 },
      { id: 'water', name: '물', price: 600, stock: 10 },
      { id: 'coffee', name: '커피', price: 700, stock: 7 },
    ];

    // 초기 잔돈통
    const initialChange: { [key: number]: number } = {
      100: 10,
      500: 5,
      1000: 3,
    };

    this.vendingMachine = new VendingMachine(initialDrinks, initialChange);

    console.log('초기화된 자판기 재고:', this.vendingMachine.drinks);
    console.log('초기화된 자판기 잔돈:', this.vendingMachine.availableChange);
  }

  /**
   * 자판기 현 상태를 리턴
   * @returns
   */
  getStatus(): VendingMachineStatus {
    const availableDrinks = this.vendingMachine.drinks.filter(
      (d) => d.stock > 0,
    );
    const totalInput =
      this.vendingMachine.currentCashInput +
      this.vendingMachine.currentCardAmount;
    let message = '음료를 선택하거나 돈을 넣어주세요.';
    if (totalInput > 0) {
      message = `현재 투입 금액: ${totalInput}원. 음료를 선택하세요.`;
    }

    return {
      currentCashInput: this.vendingMachine.currentCashInput,
      currentCardAmount: this.vendingMachine.currentCardAmount,
      availableDrinks,
      message,
    };
  }

  /**
   * 현금 투입
   * @param amount
   * @returns
   */
  insertCash(amount: number): TransactionResult {
    if (!this.vendingMachine.validCashList.includes(amount)) {
      throw new InvalidMoneyException(`유효하지 않은 화폐: ${amount}원.`);
    }

    this.vendingMachine.addCashInput(amount);

    return {
      message: `현금 ${amount}원 투입. 현재 투입 금액: ${this.vendingMachine.currentCashInput}원.`,
      currentCashInput: this.vendingMachine.currentCashInput,
    };
  }

  /**
   * 카드 투입
   * @param cardNumber
   * @param amount
   * @returns
   */
  processCardPayment(cardNumber: string, amount: number): TransactionResult {
    // 카드사 연동 로직 (Mock 함수)
    const isApproved = this.simulateCardApproval(cardNumber, amount);
    if (!isApproved) {
      throw new PaymentFailedException('카드 결제 승인에 실패했습니다.');
    }

    // 카드는 전체금액 한 번에 승인
    this.vendingMachine.setCardAmount(amount);

    return {
      message: `카드 ${amount}원 승인 준비 완료.`,
      currentCardAmount: this.vendingMachine.currentCardAmount,
    };
  }

  /**
   * 음료 구매
   * @param drinkId
   * @returns
   */
  purchaseDrink(drinkId: string): TransactionResult {
    const drink = this.vendingMachine.drinks.find((d) => d.id === drinkId);
    if (!drink) {
      throw new InvalidSelectionException('존재하지 않는 음료입니다.');
    }
    if (drink.stock <= 0) {
      throw new OutOfStockException(`${drink.name}의 재고가 없습니다.`);
    }

    const totalInput =
      this.vendingMachine.currentCashInput +
      this.vendingMachine.currentCardAmount;
    if (totalInput < drink.price) {
      throw new InsufficientFundsException(
        `${drink.name} 구매에 ${drink.price - totalInput}원이 부족합니다.`,
      );
    }

    this.vendingMachine.decreaseStock(drinkId);
    const change = totalInput - drink.price; // 남은 금액

    return {
      message: `음료 ${drink.name} 구매 완료.`,
      purchasedDrink: drink,
      change,
      currentCashInput: this.vendingMachine.currentCashInput,
      currentCardAmount: this.vendingMachine.currentCardAmount,
    };
  }

  /**
   * 현금 반환
   * @returns
   */
  returnAllCash(): TransactionResult {
    const returnedAmount = this.vendingMachine.currentCashInput;
    if (returnedAmount === 0) {
      return { message: '반환할 현금이 없습니다.' };
    }
    const actualReturned = this.vendingMachine.returnChange(returnedAmount); // 잔돈통에서 현금 반환

    return {
      message: `현금 ${actualReturned}원이 반환되었습니다.`,
      change: actualReturned,
      currentCashInput: this.vendingMachine.currentCashInput,
    };
  }

  /**
   * 주문 취소
   * 현재 투입된 금액 모두 반환, 초기화
   * 카드 결제 실패 시에도 이 로직으로 취소
   * @returns
   */
  cancelOrder(): TransactionResult {
    let message = '거래가 취소되었습니다.';
    let returnedCash = 0;

    if (this.vendingMachine.currentCashInput > 0) {
      returnedCash = this.vendingMachine.returnChange(
        this.vendingMachine.currentCashInput,
      );
      message += `현금 ${returnedCash}원이 반환됩니다.`;
    }

    if (this.vendingMachine.currentCardAmount > 0) {
      // 카드사 결제 취소 로직
      const isCancelled = this.simulateCardCancellation(
        this.vendingMachine.currentCardAmount,
      );
      if (isCancelled) {
        message += `카드 결제 ${this.vendingMachine.currentCardAmount}원이 취소되었습니다.`;
      } else {
        message += `카드 결제 ${this.vendingMachine.currentCardAmount}원 취소에 실패했습니다. 관리자에게 문의하세요.`;
        // 취소 실패 시 추가 처리 로직 필요 (수동 환불 등)
      }
    }

    this.vendingMachine.resetPayment();

    return {
      message,
      change: returnedCash,
      currentCashInput: this.vendingMachine.currentCashInput,
      currentCardAmount: this.vendingMachine.currentCardAmount,
    };
  }

  /** 내부 private 메소드 **/
  /**
   * 카드 결제 mock 함수
   * @param cardNumber
   * @param amount
   * @private
   * @returns
   */
  private simulateCardApproval(cardNumber: string, amount: number): boolean {
    this.logger.log(`카드 ${cardNumber}로 ${amount}원 결제를 시도합니다.`);

    return true;
  }

  /**
   * 카드 결제 취소 mock 함수
   * @param amount
   * @private
   * @returns
   */
  private simulateCardCancellation(amount: number): boolean {
    this.logger.log(`카드 결제 ${amount}원 취소 프로세스 중`);
    return true;
  }

  public resetStateToDefault(): void {
    const DEFAULT_DRINKS = [
      { id: 'cola', name: '콜라', price: 1100, stock: 5 },
      { id: 'water', name: '물', price: 600, stock: 10 },
      { id: 'coffee', name: '커피', price: 700, stock: 7 },
    ];

    const DEFAULT_CHANGE = {
      100: 10,
      500: 5,
      1000: 3,
    };

    // 1. 음료 재고 초기화
    this.vendingMachine.drinks = DEFAULT_DRINKS.map((drink) => {
      return {
        id: drink.id,
        name: drink.name,
        price: drink.price,
        stock: drink.stock,
      };
    });

    // 2. 잔돈 재고 초기화
    this.vendingMachine.availableChange = structuredClone(DEFAULT_CHANGE);

    // 3. 투입된 금액 초기화
    this.vendingMachine.currentCashInput = 0;
    this.vendingMachine.currentCardAmount = 0;
  }
}
