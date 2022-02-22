import { Event, Response, Session } from "@sentry/types";
import { eventStatusFromHttpCode } from '@sentry/utils'
import { sdk } from "../crossPlatform";

import { BaseTransport } from "./base";
import { sessionToSentryRequest } from '@sentry/core';

/** `XHR` based transport */
export class XHRTransport extends BaseTransport {
  /**
   * @inheritDoc
   */
  public sendEvent(event: Event): PromiseLike<Response> {
    const request = sdk.request || sdk.httpRequest;

    return this._buffer.add(
      () => new Promise<Response>((resolve, reject) => {
        // tslint:disable-next-line: no-unsafe-any
        request({
          url: this.url,
          method: "POST",
          data: JSON.stringify(event),
          header: {
            "content-type": "application/json"
          },
          success(res: { statusCode: number }): void {
            resolve({
              status: eventStatusFromHttpCode(res.statusCode)
            });
          },
          fail(error: object): void {
            reject(error);
          }
        });
      })
    );
  }
  public sendSession(session: Session): PromiseLike<Response> {
    const request = sdk.request || sdk.httpRequest;
    const sentryRequest = sessionToSentryRequest(session, this._api)
    return this._buffer.add(
      () => new Promise<Response>((resolve, reject) => {
        // tslint:disable-next-line: no-unsafe-any
        request({
          url: sentryRequest.url,
          method: "POST",
          data: sentryRequest.body,
          header: {
            "content-type": "application/json"
          },
          success(res: { statusCode: number }): void {
            resolve({
              status: eventStatusFromHttpCode(res.statusCode)
            });
          },
          fail(error: object): void {
            reject(error);
          }
        });
      })
    );
  }
}
