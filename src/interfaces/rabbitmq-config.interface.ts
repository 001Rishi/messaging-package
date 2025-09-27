export interface RabbitMQExchangeConfig {
  name: string;
  type: 'topic' | 'direct' | 'fanout';
  options?: {
    durable?: boolean;
    autoDelete?: boolean;
  };
}

export interface RabbitMQQueueConfig {
  name: string;
  exchange: string;
  routingKey: string;
  options?: {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
    deadLetterExchange?: string;
    deadLetterRoutingKey?: string;
  };
}

export interface RabbitMQModuleConfig {
  connection: {
    urls: string[];
    queueOptions?: {
      durable?: boolean;
      exclusive?: boolean;
      autoDelete?: boolean;
    };
  };
  exchanges: RabbitMQExchangeConfig[];
  queues: RabbitMQQueueConfig[];
  defaultTimeout?: number;
  prefetchCount?: number;
}

export interface MessagePayload<T = any> {
  pattern: string;

  id: string;
  timestamp: Date;
  source: string;
  correlationId?: string;
}

export interface SuccessMessage<T = any> extends MessagePayload<T> {
  data: T;
  status: 'success';
}

export interface ErrorMessage<T = any> extends MessagePayload<T> {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
