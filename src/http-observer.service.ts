import { Injectable, EventEmitter, Inject } from '@angular/core';
import { HTTP_OBSERVER_OPTIONS } from './http-observer.options';

export interface RequestInterface {
  timestamp: number;
  url: string;
}

export interface RequestGroupInterface {
  name: string;
  requests: Array<RequestInterface>;
  whitelistedRoutes: Array<string | RegExp>;
  blacklistedRoutes: Array<string | RegExp>;
  delay: number;
  timeout: number;
  isPendingEventSent: boolean;
}

export interface RequestTimeout {
  requestGroupName: string;
  url: string;
  timeout: number;
}

export interface DelayedResponse {
  requestGroupName: string;
  url: string;
  timeout: number;
  duration: number;
}

@Injectable()
export class HttpObserverService {
  public isPending: EventEmitter<string> = new EventEmitter();
  public hasFinished: EventEmitter<string> = new EventEmitter();
  public timedOutRequest: EventEmitter<RequestTimeout> = new EventEmitter();
  public delayedResponse: EventEmitter<DelayedResponse> = new EventEmitter();

  private requestGroups: Array<RequestGroupInterface> = [];

  constructor(@Inject(HTTP_OBSERVER_OPTIONS) config: any) {
    const requestGroups = config.requestGroups ? JSON.parse(JSON.stringify(config.requestGroups)) : [];

    requestGroups.push({ name: 'default' });

    for (const group of requestGroups) {
      if (group.whitelistedRoutes === undefined) group.whitelistedRoutes = config.whitelistedRoutes;
      if (group.blacklistedRoutes === undefined) group.blacklistedRoutes = config.blacklistedRoutes;
      if (group.delay === undefined) group.delay = config.delay === undefined ? 200 : config.delay;
      if (group.timeout === undefined) group.timeout = config.timeout === undefined ? null : config.timeout;

      this.requestGroups.push(Object.assign(group, {
        isPendingEventSent: false,
        requests: [],
      }));
    }
  }

  private isString(value: any): boolean {
    return (typeof value === 'string' || value instanceof String);
  }

  private isRegex(value: any): boolean {
    return value instanceof RegExp;
  }

  private urlMatchesListItem(url: string, list: Array<string | RegExp>): boolean {
    for (const item of list) {
      if (this.isRegex(item)) {
        if (url.match(item)) {
          return true;
        }
      } else if (this.isString(item)) {
        if (url.includes(item.toString())) {
          return true;
        }
      }
    }
    return false;
  }

  private isUrlAllowed(group: RequestGroupInterface, url: string): boolean {
    return group.whitelistedRoutes ? this.urlMatchesListItem(url, group.whitelistedRoutes) : true;
  }

  private isUrlForbidden(group: RequestGroupInterface, url: string): boolean {
    return group.blacklistedRoutes ? this.urlMatchesListItem(url, group.blacklistedRoutes) : false;
  }

  private isUrlRelevant(group: RequestGroupInterface, url: string): boolean {
    return (this.isUrlAllowed(group, url) && !this.isUrlForbidden(group, url));
  }

  public addRequest(timestamp: number, url: string) {
    for (const group of this.requestGroups) {
      if (this.isUrlRelevant(group, url)) {
        const request = { timestamp, url } as RequestInterface;
        group.requests.push(request);
        setTimeout(() => {
          if (group.requests.length > 0 && !group.isPendingEventSent) {
            this.emitPending(group);
          }
        }, group.delay);
        if (group.timeout !== null) {
          setTimeout(() => {
            if (group.requests.indexOf(request) !== -1) {
              this.requestTimedOut(group, request);
            }
          }, group.timeout);
        }
      }
    }
  }

  public addResponse(timestamp: number, url: string) {
    for (const group of this.requestGroups) {
      if (this.isUrlRelevant(group, url)) {
        const request = group.requests.find(o => o.timestamp === timestamp && o.url === url);
        if (request) {
          group.requests.splice(group.requests.indexOf(request), 1);
          if (group.requests.length === 0 && group.isPendingEventSent) {
            this.emitFinished(group);
          }
        } else {
          this.emitDelayedResponse(group, timestamp, url);
        }
      }
    }
  }

  private requestTimedOut(group: RequestGroupInterface, request: RequestInterface): void {
    if (group.requests.indexOf(request) !== -1) {
      group.requests.splice(group.requests.indexOf(request), 1);
      this.emitTimedOutRequest(group, request);
      if (group.requests.length === 0 && group.isPendingEventSent) {
        this.emitFinished(group);
      }
    }
  }

  private emitPending(group: RequestGroupInterface) {
    group.isPendingEventSent = true;
    this.isPending.emit(group.name);
  }

  private emitFinished(group: RequestGroupInterface) {
    group.isPendingEventSent = false;
    this.hasFinished.emit(group.name);
  }

  private emitTimedOutRequest(group: RequestGroupInterface, request: RequestInterface) {
    this.timedOutRequest.emit({
      requestGroupName: group.name,
      url: request.url,
      timeout: group.timeout
    });
  }

  private emitDelayedResponse(group: RequestGroupInterface, timestamp: number, url: string) {
    this.delayedResponse.emit({
      requestGroupName: group.name,
      url: url,
      timeout: group.timeout,
      duration: new Date().getTime() - timestamp
    });
  }
}
