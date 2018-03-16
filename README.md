# angular-http-observer

[![Dev Dependencies](https://img.shields.io/david/dev/KorbinianKuhn/angular-http-observer.svg?style=flat-square)](https://david-dm.org/KorbinianKuhn/angular-http-observer)
[![npm](https://img.shields.io/npm/dt/@korbiniankuhn/angular-http-observer.svg?style=flat-square)](https://www.npmjs.com/package/@korbiniankuhn/angular-http-observer)
[![npm-version](https://img.shields.io/npm/v/@korbiniankuhn/angular-http-observer.svg?style=flat-square)](https://www.npmjs.com/package/@korbiniankuhn/angular-http-observer)
![license](https://img.shields.io/github/license/KorbinianKuhn/angular-http-observer.svg?style=flat-square)

Small utility to track angular http requests to get notified on completion and timeouts. Example use case is a loading bar that appears while requests are pending. Easy configurable debounce delay, request timeout and url blacklisting or whitelisting.

## Installation

For installation use the [Node Package Manager](https://github.com/npm/npm):

```
$ npm install --save @korbiniankuhn/angular-http-observer
```

or clone the repository:

```
$ git clone https://github.com/KorbinianKuhn/angular-http-observer
```

## Getting Started

Import the ```HttpObserverModule``` and add it to your imports list. Call the ```forRoot``` method. Be sure you use the ```HttpClientModule``` as the observer works with an ```HttpInterceptor```.

```typescript
import { HttpObserverModule } from '@korbiniankuhn/angular-http-observer';
import { HttpClientModule } from '@angular/common/http';

export function tokenGetter() {
  return localStorage.getItem('access_token');
}

@NgModule({
  bootstrap: [AppComponent],
  imports: [
    // ...
    HttpClientModule,
    HttpObserverModule.forRoot()
  ]
})
export class AppModule {}
```

Subscribe to the events of the ```HttpObserverService```:

``` typescript
export class LoadingBarComponent implements OnInit {
  private showLoadingBar = false;

  constructor(private httpObserver: HttpObserverService) {}

  ngOnInit() {
    httpObserver.isPending.subscribe((groupName) => {
      this.showLoadingBar = true;
    });

    httpObserver.hasFinished.subscribe((groupName) => {
      this.showLoadingBar = false;
    });
  }
}
```

## Options

You can configure the observer with following options. By default a delay of 200ms and no timeout is set.

``` typescript
// ...
HttpObserverModule.forRoot({
  whitelistedDomains: ['foo.com', /bar.com/],
  blacklistedDomains: [/localhost/],
  delay: 0,
  timeout: 10000
})
```

The observer can have multiple request groups with different settings, to observe different requests across components. By default a requestGroup with the name ```default``` is created. A ```requestGroup``` inherits and overwrites the global options.

``` typescript
// ...
HttpObserverModule.forRoot({
  whitelistedDomains: ['foo.com', /bar.com/],
  blacklistedDomains: [/localhost/],
  delay: 0,
  timeout: 10000,
  requestGroups: [{
    name: 'localhost',
    whitelistedDomains: [/localhost/],
    blacklistedDomains: null,
    timeout: 2000
  }]
})
```

## Events

The following events are emitted by the observer.

``` typescript
/ ...
httpObserver.isPending.subscribe((groupName) => {
  console.log(groupName);
  // default

  if (groupName === 'custom') {
    console.log('show my custom loading bar');
  }
});

httpObserver.hasFinished.subscribe((groupName) => {
  console.log(groupName);
  // default
});

httpObserver.timedOutRequest.subscribe((object) => {
  console.log(object);
  // { requestGroupName: 'default', url: 'localhost', timeout: 2000 }
});

httpObserver.timedOutRequest.subscribe((object) => {
  console.log(object);
  // { requestGroupName: 'default', url: 'localhost', timeout: 2000, duration: 3629 }
});
```

## Testing

First you have to install all dependencies:

```
$ npm install
```

To execute all unit tests once, use:

```
$ npm test
```

To get information about the test coverage, use:

```
$ npm run coverage
```

## Contribution

Get involved and push in your ideas.

Do not forget to add corresponding tests to keep up 100% test coverage.

## License

The MIT License

Copyright (c) 2018 Korbinian Kuhn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.