import { BaseClient, Scope, getReportDialogEndpoint } from "@sentry/core";
import { DsnLike, Event, EventHint } from "@sentry/types";
import { getGlobalObject, logger } from "@sentry/utils";

import { MiniappBackend, MiniappOptions } from "./backend";
import { SDK_NAME, SDK_VERSION } from "./version";

/**
 * All properties the report dialog supports
 */
export interface ReportDialogOptions {
  [key: string]: any;
  eventId?: string;
  dsn?: DsnLike;
  user?: {
    email?: string;
    name?: string;
  };
  lang?: string;
  title?: string;
  subtitle?: string;
  subtitle2?: string;
  labelName?: string;
  labelEmail?: string;
  labelComments?: string;
  labelClose?: string;
  labelSubmit?: string;
  errorGeneric?: string;
  errorFormEntry?: string;
  successMessage?: string;
  /** Callback after reportDialog showed up */
  onLoad?(): void;
}

/**
 * The Sentry Miniapp SDK Client.
 *
 * @see MiniappOptions for documentation on configuration options.
 * @see SentryClient for usage documentation.
 */
export class MiniappClient extends BaseClient<MiniappBackend, MiniappOptions> {
  /**
   * Creates a new Miniapp SDK instance.
   *
   * @param options Configuration options for this SDK.
   */
  public constructor(options: MiniappOptions = {}) {
    super(MiniappBackend, options);
  }

  /**
   * @inheritDoc
   */
  protected _prepareEvent(event: Event, scope?: Scope, hint?: EventHint): PromiseLike<Event | null> {
    event.platform = event.platform || "javascript";
    event.sdk = {
      ...event.sdk,
      name: SDK_NAME,
      packages: [
        ...((event.sdk && event.sdk.packages) || []),
        {
          name: "npm:@sentry/miniapp",
          version: SDK_VERSION
        }
      ],
      version: SDK_VERSION
    };

    return super._prepareEvent(event, scope, hint);
  }

  /**
   * Show a report dialog to the user to send feedback to a specific event.
   * 向用户显示报告对话框以将反馈发送到特定事件。---> 小程序上暂时用不到&不考虑。
   *
   * @param options Set individual options for the dialog
   */
  public showReportDialog(options: ReportDialogOptions = {}): void {
    // doesn't work without a document (React Native)
    const document = getGlobalObject<Window>().document;
    if (!document) {
      return;
    }

    if (!this._isEnabled()) {
      logger.error(
        "Trying to call showReportDialog with Sentry Client is disabled"
      );
      return;
    }

    const dsn = options.dsn || this.getDsn();

    if (!options.eventId) {
      logger.error("Missing `eventId` option in showReportDialog call");
      return;
    }

    if (!dsn) {
      logger.error("Missing `Dsn` option in showReportDialog call");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = getReportDialogEndpoint(dsn, options);

    if (options.onLoad) {
      script.onload = options.onLoad;
    }

    (document.head || document.body).appendChild(script);
  }
}
