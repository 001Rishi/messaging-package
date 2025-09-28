import { DynamicModule, Module, Provider, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { RabbitMQModuleConfig } from './interfaces/rabbitmq-config.interface';
import {
  RABBITMQ_MODULE_OPTIONS,
  RABBITMQ_HANDLERS,
} from './constants/rabbitmq.constants';
import { RabbitMQClientService } from './services/rabbitmq-client.service';
import { MessageHandlerService } from './services/message-handler.service';
import { RabbitMQHandlerOptions } from './decorators/rabbitmq-handler.decorator';

@Module({
  imports: [DiscoveryModule],
  providers: [MessageHandlerService],
  exports: [MessageHandlerService],
})
export class RabbitMQCommunicationModule implements OnModuleInit {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly messageHandlerService: MessageHandlerService,
    private readonly clientService: RabbitMQClientService,
  ) {}

  static forRoot(config: RabbitMQModuleConfig): DynamicModule {
    const providers: Provider[] = [
      {
        provide: RABBITMQ_MODULE_OPTIONS,
        useValue: config,
      },
      RabbitMQClientService,
      MessageHandlerService,
    ];

    return {
      module: RabbitMQCommunicationModule,
      global: true,
      providers,
      exports: [RabbitMQClientService, MessageHandlerService],
    };
  }

  async onModuleInit() {
    await this.registerMessageHandlers();
  }

  private async registerMessageHandlers() {
    const handlers =
      await this.discoveryService.providerMethodsWithMetaAtKey<RabbitMQHandlerOptions>(
        RABBITMQ_HANDLERS,
      );

    for (const handler of handlers) {
      const { meta, discoveredMethod } = handler;
      const instance = discoveredMethod.parentClass.instance;

      this.messageHandlerService.registerHandler(
        meta.routingKey,
        discoveredMethod.handler.bind(instance),
      );
    }
  }
}
