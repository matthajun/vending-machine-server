import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // app.setGlobalPrefix('vending-machine-server');

  const API_DOC_PATH = 'api/docs';
  const swaggerConfig = new DocumentBuilder()
    .setTitle('vending-machine-server')
    .setDescription('Vending-machine server API description')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(API_DOC_PATH, app, document);

  // app.setGlobalPrefix('');

  app.useGlobalPipes(
    new ValidationPipe({
      // decorator 가 달린 field 만 유효성 검사를 하는 옵션
      whitelist: true,
      // string 으로 들어오는 param 을 entity type 에 맞춰 변형시켜주는 옵션
      // 예) id: number 가 param 에 string 으로 들어와도 number 로 변환시켜 controller 에 넘겨줌
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory(errors: any) {
        const errorProperties = errors.map((error) => error.property);
        let errorMessage = errors.map((error) => error.constraints);
        if (errorMessage.length) {
          const errorMessageValue = Object.values(errorMessage[0])[0];
          errorMessage = `Validation failed: ${errorProperties.join(',')}, ${errorMessageValue}`;
        } else {
          errorMessage = `Validation failed: ${errorProperties.join(',')}`;
        }

        return new BadRequestException(errorMessage);
      },
    }),
  );

  const PORT = '3000';
  await app.listen(PORT);
}
bootstrap();
