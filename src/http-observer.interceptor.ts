import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { HttpObserverService } from './http-observer.service';

@Injectable()
export class HttpObserverInterceptor implements HttpInterceptor {
  constructor(private httpObserverService: HttpObserverService) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timestamp = new Date().getTime();
    this.httpObserverService.addRequest(timestamp, req.url);
    return next.handle(req).pipe(finalize(() => this.httpObserverService.addResponse(timestamp, req.url)));
  }
}
