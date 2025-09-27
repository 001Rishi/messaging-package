import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  MessageHandler,
  Ctx,
  Payload,
  EventPattern,
} from '@nestjs/microservices';
import { RabbitMQHandlerOptions } from '../decorators/rabbitmq-handler.decorator';
import * as rabbitmqConfigInterface from '../interfaces/rabbitmq-config.interface';
import { RmqContext } from '@nestjs/microservices';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);
  private handlers = new Map<string, Function>();

  registerHandler(pattern: string, handler: Function) {
    this.handlers.set(pattern, handler);
  }

  @EventPattern('success.*')
  async handleSuccessMessage(
    @Payload() payload: rabbitmqConfigInterface.SuccessMessage,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.debug(`Received success message: ${payload.pattern}`);

      const handler = this.handlers.get(payload.pattern);
      if (handler) {
        await handler(payload.data, payload);
      } else {
        this.logger.warn(`No handler found for pattern: ${payload.pattern}`);
      }

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Error handling success message: ${error.message}`,
        error.stack,
      );
      channel.nack(originalMsg, false, false); // Don't requeue
    }
  }

  @EventPattern('error.*')
  async handleErrorMessage(
    @Payload() payload: rabbitmqConfigInterface.ErrorMessage,
    @Ctx() context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      this.logger.error(
        `Received error message: ${payload.pattern}`,
        payload.error,
      );

      const handler = this.handlers.get(payload.pattern);
      if (handler) {
        await handler(payload.error, payload);
      } else {
        this.logger.warn(
          `No error handler found for pattern: ${payload.pattern}`,
        );
      }

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Error handling error message: ${error.message}`,
        error.stack,
      );
      channel.nack(originalMsg, false, false);
    }
  }
}
