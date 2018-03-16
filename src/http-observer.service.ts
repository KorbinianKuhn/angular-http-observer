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

export interface TimeoutResponse {
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
  public timedOutResponse: EventEmitter<TimeoutResponse> = new EventEmitter();

  private requestGroups: Array<RequestGroupInterface> = [];

  constructor( @Inject(HTTP_OBSERVER_OPTIONS) config: any) {
    Object.assign(config, {
      whitelistedRoutes: null,
      blacklistedRoutes: null,
      delay: 200,
      timeout: null
    });

    if (!config.requestGroups) {
      config.requestGroups = [{ name: 'default' }];
    }

    for (const group of config.requestGroups) {
      this.requestGroups.push(Object.assign(group, {
        whitelistedRoutes: config.whitelistedRoutes,
        blacklistedRoutes: config.blacklistedRoutes,
        delay: config.delay,
        timeout: config.timeout,
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

  addRequest(timestamp: number, url: string) {
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

  addResponse(timestamp: number, url: string) {
    for (const group of this.requestGroups) {
      if (this.isUrlRelevant(group, url)) {
        const request = group.requests.find(o => o.timestamp === timestamp && o.url === url);
        if (request) {
          group.requests.splice(group.requests.indexOf(request), 1);
          if (group.requests.length === 0 && group.isPendingEventSent) {
            this.emitFinished(group);
          }
        } else {
          this.emitTimedOutResponse(group, timestamp, url);
        }
      }
    }
  }

  private requestTimedOut(group: RequestGroupInterface, request: RequestInterface): void {
    if (group.requests.indexOf(request) !== -1) {
      group.requests.splice(group.requests.indexOf(request), 1);
      this.emitTimedOutRequest(group, request);
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

  private emitTimedOutResponse(group: RequestGroupInterface, timestamp: number, url: string) {
    this.timedOutResponse.emit({
      requestGroupName: group.name,
      url: url,
      timeout: group.timeout,
      duration: new Date().getTime() - timestamp
    });
  }
}
