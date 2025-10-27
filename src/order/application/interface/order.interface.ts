export interface Drink {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface VendingMachineStatus {
  currentCashInput: number;
  currentCardAmount: number; // 카드 결제는 보통 전체 금액을 한 번에 승인
  availableDrinks: Drink[];
  message: string;
}

export interface TransactionResult {
  message: string;
  purchasedDrink?: Drink;
  change?: number;
  currentCashInput?: number;
  currentCardAmount?: number;
}
