import { Module } from '@nestjs/common';
import { RabbitMQCommunicationModule } from './modules/rabbitmq-communications.module';

@Module({
  imports: [RabbitMQCommunicationModule],
  controllers: [],
  providers: [],
  exports: [RabbitMQCommunicationModule],
})
export class AppModule {}
