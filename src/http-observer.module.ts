import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpObserverInterceptor } from './http-observer.interceptor';
import { HttpObserverService } from './http-observer.service';
import { HTTP_OBSERVER_OPTIONS } from './http-observer.options';

export interface HttpObserverOptions {
  whitelistedRoutes?: Array<string | RegExp>;
  blacklistedRoutes?: Array<string | RegExp>;
  delay?: number;
  timeout?: number;
  requestGroups?: Array<HttpObserverRequestGroupOptions>;
}

export interface HttpObserverRequestGroupOptions {
  name: string;
  whitelistedRoutes?: Array<string | RegExp>;
  blacklistedRoutes?: Array<string | RegExp>;
  delay?: number;
  timeout?: number;
}

@NgModule()
export class HttpObserverModule {

  constructor( @Optional() @SkipSelf() parentModule: HttpObserverModule) {
    if (parentModule) {
      throw new Error(`HttpObserverModule is already loaded. It should only be imported in your application's main module.`);
    }
  }
  static forRoot(options: HttpObserverOptions = {}): ModuleWithProviders {
    return {
      ngModule: HttpObserverModule,
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpObserverInterceptor,
          multi: true
        },
        {
          provide: HTTP_OBSERVER_OPTIONS,
          useValue: options
        },
        HttpObserverService
      ]
    };
  }
}
