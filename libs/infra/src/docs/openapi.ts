import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupDocs(app: INestApplication, title: string): void {
  /* ── OpenAPI spec ───────────────────── */
  const config = new DocumentBuilder()
    .setTitle(title)
    .setDescription(`${title} documentation`)
    .setVersion('1.0')
    .build();

  const document: OpenAPIObject = SwaggerModule.createDocument(app, config);

  /* Swagger UI (optional) */
  SwaggerModule.setup('/swagger', app, document);

  /* Scalar UI */
  app.use(
    '/reference',
    apiReference({
      content: document,
      theme: 'purple',
    }),
  );
}
