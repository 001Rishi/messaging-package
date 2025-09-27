import { SetMetadata } from '@nestjs/common';
import { RABBITMQ_HANDLERS } from '../constants/rabbitmq.constants';

export interface RabbitMQHandlerOptions {
  exchange: string;
  routingKey: string;
  queue?: string;
  errorHandler?: boolean;
}

export const RabbitMQHandler = (options: RabbitMQHandlerOptions) => {
  return SetMetadata(RABBITMQ_HANDLERS, options);
};

export const RabbitMQSuccessHandler = (routingKey: string, queue?: string) => {
  return RabbitMQHandler({
    exchange: 'success_exchange',
    routingKey,
    queue: queue || `success_${routingKey}`,
    errorHandler: false,
  });
};

export const RabbitMQErrorHandler = (routingKey: string, queue?: string) => {
  return RabbitMQHandler({
    exchange: 'error_exchange',
    routingKey,
    queue: queue || `error_${routingKey}`,
    errorHandler: true,
  });
};
