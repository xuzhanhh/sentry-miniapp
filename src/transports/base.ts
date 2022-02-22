import { API, initAPIDetails } from "@sentry/core";
import { Event, Response, Transport, TransportOptions } from "@sentry/types";
import { PromiseBuffer, SentryError, makePromiseBuffer } from "@sentry/utils";

/** Base Transport class implementation */
export abstract class BaseTransport implements Transport {
  /**
   * @inheritDoc
   */
  public url: string;
  public _api: any;

  /** A simple buffer holding all requests. */
  protected readonly _buffer: PromiseBuffer<Response> = makePromiseBuffer(30);

  public constructor(public options: TransportOptions) {
    this.url = new API(this.options.dsn).getStoreEndpointWithUrlEncodedAuth();
    this._api = initAPIDetails(options.dsn, options._metadata, options.tunnel)
    // this.sessionUrl = new API(this.options.dsn).getStoreEndpoint
  }

  /**
   * @inheritDoc
   */
  public sendEvent(_: Event): PromiseLike<Response> {
    throw new SentryError(
      "Transport Class has to implement `sendEvent` method"
    );
  }

  /**
   * @inheritDoc
   */
  public close(timeout?: number): PromiseLike<boolean> {
    return this._buffer.drain(timeout);
  }
}
