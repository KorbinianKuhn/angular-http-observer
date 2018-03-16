import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import 'rxjs/add/operator/finally';
import { Observable } from 'rxjs/Observable';
import { HttpObserverService } from './http-observer.service';

@Injectable()
export class HttpObserverInterceptor implements HttpInterceptor {
  constructor(private httpObserverService: HttpObserverService) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timestamp = new Date().getTime();
    this.httpObserverService.addRequest(timestamp, req.url);
    return next.handle(req).finally(() => this.httpObserverService.addResponse(timestamp, req.url));
  }
}
