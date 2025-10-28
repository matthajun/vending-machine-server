import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { OrderService } from '../src/order/application/order.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let orderService: OrderService;
  let http;

  // 테스트에 사용할 고정 ID 및 가격
  const COLA_ID = 'cola';
  const COLA_PRICE = 1100;
  const INITIAL_COLA_STOCK = 5;

  // 테스트 환경 설정
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    http = request(app.getHttpServer());

    orderService = app.get<OrderService>(OrderService);
  });

  // 케이스 마다 자판기 변수를 초기화한다.
  beforeEach(() => {
    orderService.resetStateToDefault();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /status', () => {
    it('초기 상태를 올바르게 반환해야 함', () => {
      return http
        .get('/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(0);
          expect(res.body.availableDrinks).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: COLA_ID,
                stock: INITIAL_COLA_STOCK,
              }),
            ]),
          );
        });
    });
  });

  describe('시나리오 1: 현금 구매', () => {
    it('1. POST /insert-cash: 현금 투입', async () => {
      await http
        .post('/insert-cash')
        .send({ amount: 1000 })
        .expect(201)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(1000);
        });

      // 2. 500원 추가 투입
      return http
        .post('/insert-cash')
        .send({ amount: 500 })
        .expect(201)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(1500);
        });
    });

    it('2. POST /purchase: 투입된 현금으로 음료 구매', async () => {
      await http.post('/insert-cash').send({ amount: 1000 });
      await http.post('/insert-cash').send({ amount: 500 });

      return http
        .post('/purchase')
        .send({ drinkId: COLA_ID })
        .expect(201)
        .expect((res) => {
          expect(res.body.purchasedDrink.id).toBe(COLA_ID);
          expect(res.body.change).toBe(1500 - COLA_PRICE);
        });
    });

    it('3. GET /status: 구매 후 상태 확인 (재고 감소, 투입 금액 차감)', async () => {
      await http.post('/insert-cash').send({ amount: 5000 });
      await http.post('/purchase').send({ drinkId: COLA_ID });

      return http
        .get('/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(3900); // 남은 돈
          expect(
            res.body.availableDrinks.find((d) => d.id === COLA_ID).stock,
          ).toBe(INITIAL_COLA_STOCK - 1); // 재고 감소
        });
    });

    it('4. POST /return-cash: 남은 잔돈 반환', async () => {
      await http.post('/insert-cash').send({ amount: 5000 });
      await http.post('/purchase').send({ drinkId: COLA_ID });

      return http
        .post('/return-cash')
        .expect(201)
        .expect((res) => {
          expect(res.body.change).toBe(3900);
        });
    });

    it('5. GET /status: 잔돈 반환 후 상태 확인 (투입 금액 0)', async () => {
      await http.post('/insert-cash').send({ amount: 1500 });
      await http.post('/purchase').send({ drinkId: COLA_ID });
      await http.post('/return-cash');

      return http
        .get('/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(0);
        });
    });
  });

  describe('시나리오 2: 카드 구매 (Happy Path)', () => {
    it('1. POST /insert-card: 카드 투입 (결제 요청)', () => {
      return http
        .post('/insert-card')
        .send({ cardNumber: '1234-5678', amount: COLA_PRICE })
        .expect(201)
        .expect((res) => {
          expect(res.body.message).toContain('승인 준비 완료');
          expect(res.body.currentCardAmount).toBe(COLA_PRICE);
        });
    });

    it('2. POST /purchase: 카드로 음료 구매', async () => {
      await http
        .post('/insert-card')
        .send({ cardNumber: '1234-5678', amount: COLA_PRICE });

      return http
        .post('/purchase')
        .send({ drinkId: COLA_ID })
        .expect(201)
        .expect((res) => {
          expect(res.body.purchasedDrink.id).toBe(COLA_ID);
          expect(res.body.currentCashInput).toBe(0);
          expect(res.body.currentCardAmount).toBe(0);
        });
    });

    it('3. GET /status: 카드 구매 후 상태 확인', async () => {
      await http
        .post('/insert-card')
        .send({ cardNumber: '1234-5678', amount: COLA_PRICE });
      await http.post('/purchase').send({ drinkId: COLA_ID });

      return http
        .get('/status')
        .expect(200)
        .expect((res) => {
          expect(res.body.currentCashInput).toBe(0);
          expect(
            res.body.availableDrinks.find((d) => d.id === COLA_ID).stock,
          ).toBe(INITIAL_COLA_STOCK - 1);
        });
    });
  });
});
