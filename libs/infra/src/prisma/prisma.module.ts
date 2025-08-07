import { Global, Module, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@generated/prisma';

export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  enableShutdownHooks(app: INestApplication): void {
    process.on('beforeExit', () => {
      void app.close(); // swallow the Promise → lint passes
    });
  }
}

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
