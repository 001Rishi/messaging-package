import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ClientProxy, ClientRMQ, RmqContext } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import * as rabbitmqConfigInterface from '../interfaces/rabbitmq-config.interface';
import { RABBITMQ_MODULE_OPTIONS } from '../constants/rabbitmq.constants';
import {
  MessagePayload,
  SuccessMessage,
  ErrorMessage,
} from '../interfaces/rabbitmq-config.interface';

@Injectable()
export class RabbitMQClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQClientService.name);
  private client: ClientProxy;
  private successClient: ClientProxy;
  private errorClient: ClientProxy;

  constructor(
    @Inject(RABBITMQ_MODULE_OPTIONS)
    private readonly config: rabbitmqConfigInterface.RabbitMQModuleConfig,
  ) {}

  async onModuleInit() {
    this.client = new ClientRMQ({
      urls: this.config.connection.urls,
      queue: '', // We'll use exchanges directly
      queueOptions: this.config.connection.queueOptions,
      prefetchCount: this.config.prefetchCount || 10,
    });

    this.successClient = new ClientRMQ({
      urls: this.config.connection.urls,
      queue: '', // Using exchange directly
      queueOptions: this.config.connection.queueOptions,
    });

    this.errorClient = new ClientRMQ({
      urls: this.config.connection.urls,
      queue: '', // Using exchange directly
      queueOptions: this.config.connection.queueOptions,
    });

    await this.client.connect();
    await this.successClient.connect();
    await this.errorClient.connect();
  }

  async onModuleDestroy() {
    await this.client.close();
    await this.successClient.close();
    await this.errorClient.close();
  }

  async sendSuccess<T, R>(
    pattern: string,
    data: T,
    correlationId?: string,
  ): Promise<R> {
    const payload: SuccessMessage<T> = {
      pattern,
      data,
      id: this.generateId(),
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'unknown',
      correlationId,
      status: 'success',
    };

    this.logger.debug(`Sending success message: ${pattern}`);

    return firstValueFrom(
      this.successClient
        .send(pattern, payload)
        .pipe(timeout(this.config.defaultTimeout || 30000)),
    );
  }

  async sendError<T>(
    pattern: string,
    error: { code: string; message: string; details?: any },
    correlationId?: string,
  ): Promise<void> {
    const payload: ErrorMessage<T> = {
      pattern,
      //   data: null,
      id: this.generateId(),
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'unknown',
      correlationId,
      status: 'error',
      error,
    };

    this.logger.debug(`Sending error message: ${pattern}`);

    await firstValueFrom(
      this.errorClient
        .emit(pattern, payload)
        .pipe(timeout(this.config.defaultTimeout || 30000)),
    );
  }

  async emitSuccess<T>(
    pattern: string,
    data: T,
    correlationId?: string,
  ): Promise<void> {
    const payload: SuccessMessage<T> = {
      pattern,
      data,
      id: this.generateId(),
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'unknown',
      correlationId,
      status: 'success',
    };

    this.logger.debug(`Emitting success message: ${pattern}`);

    await firstValueFrom(
      this.successClient
        .emit(pattern, payload)
        .pipe(timeout(this.config.defaultTimeout || 30000)),
    );
  }

  async emitError<T>(
    pattern: string,
    error: { code: string; message: string; details?: any },
    correlationId?: string,
  ): Promise<void> {
    const payload: ErrorMessage<T> = {
      pattern,
      //   data: null,
      id: this.generateId(),
      timestamp: new Date(),
      source: process.env.SERVICE_NAME || 'unknown',
      correlationId,
      status: 'error',
      error,
    };

    this.logger.debug(`Emitting error message: ${pattern}`);

    await firstValueFrom(
      this.errorClient
        .emit(pattern, payload)
        .pipe(timeout(this.config.defaultTimeout || 30000)),
    );
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getContext(pattern: string): RmqContext {
    // This would be enhanced based on your specific needs
    return new RmqContext([] as any);
  }
}
