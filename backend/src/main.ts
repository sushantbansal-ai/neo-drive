import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('NEO Drive API')
    .setDescription('The NEO Drive API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const Port = process.env.PORT ?? 3000;
  await app.listen(Port).then(() => {
    console.log(`Application is running on: ${Port} port`);
  });
}
bootstrap();
