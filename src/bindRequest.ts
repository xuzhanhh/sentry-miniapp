import { getCurrentHub } from '@sentry/core';

function isInstanceOf(wat: any, base: any): boolean {
  try {
    return wat instanceof base;
  } catch (_e) {
    return false;
  }
}

function getFetchMethod(fetchArgs: any[] = []): string {
  if ('Request' in global && isInstanceOf(fetchArgs[0], Request) && fetchArgs[0].method) {
    return String(fetchArgs[0].method).toUpperCase();
  }
  if (fetchArgs[1] && fetchArgs[1].method) {
    return String(fetchArgs[1].method).toUpperCase();
  }
  return 'GET';
}

/** Extract `url` from fetch call arguments */
function getFetchUrl(fetchArgs: any[] = []): string {
  if (typeof fetchArgs[0] === 'string') {
    return fetchArgs[0];
  }
  return fetchArgs[0].url;
}

function fetchBreadcrumb(handlerData: { [key: string]: any }): void {
  // We only capture complete fetch requests
  if (!handlerData.endTimestamp) {
    return;
  }

  if (handlerData.fetchData.url.match(/sentry_key/) && handlerData.fetchData.method === 'POST') {
    // We will not create breadcrumbs for fetch requests that contain `sentry_key` (internal sentry requests)
    return;
  }

  if (handlerData.error) {
    getCurrentHub().addBreadcrumb(
      {
        category: 'fetch',
        data: {...handlerData.fetchData, status_code: handlerData.response.statusCode},
        // level: ,
        type: 'http',
      },
      {
        data: handlerData.error,
        input: handlerData.args,
      },
    );
  } else {
    getCurrentHub().addBreadcrumb(
      {
        category: 'fetch',
        data: {
          ...handlerData.fetchData,
          status_code: handlerData.response.statusCode,
        },
        type: 'http',
      },
      {
        input: handlerData.args,
        response: handlerData.response.data,
      },
    );
  }
}

export const bindRequest = (originFetch: () => void): () => void => {
  return (...args: any[]): void => {
    const handlerData = {
      args,
      fetchData: {
        method: getFetchMethod(args),
        url: getFetchUrl(args),
      },
      startTimestamp: Date.now(),
    };
    fetchBreadcrumb(handlerData)
    return originFetch.apply(global, args).then(
      (response: Response) => {
        fetchBreadcrumb({ ...handlerData, endTimestamp: Date.now(), response })
        return response
      },
      (error: Error) => {
        fetchBreadcrumb({ ...handlerData, endTimestamp: Date.now(), error })
        throw error
      }
    )
  }
}
