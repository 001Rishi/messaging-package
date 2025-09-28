import { DynamicModule, Module, Provider, OnModuleInit } from '@nestjs/common';
import { DiscoveryModule, DiscoveryService } from '@golevelup/nestjs-discovery';
import { MessageHandlerService } from 'src/services/message-handler.service';
import { RabbitMQClientService } from 'src/services/rabbitmq-client.service';
import { RabbitMQModuleConfig } from 'src/interfaces/rabbitmq-config.interface';
import {
  RABBITMQ_HANDLERS,
  RABBITMQ_MODULE_OPTIONS,
} from 'src/constants/rabbitmq.constants';
import { RabbitMQHandlerOptions } from 'src/decorators/rabbitmq-handler.decorator';

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
