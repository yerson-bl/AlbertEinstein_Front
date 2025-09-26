// // src/app/utils/http-headers.util.ts
// import { HttpHeaders } from '@angular/common/http';
// import { CookieService } from 'ngx-cookie-service';
// import { getSessionFromCookie } from 'src/app/utils/utils';

// export function buildHeaders(cookieService: CookieService, useJson: boolean = true) {
//   const session = getSessionFromCookie(cookieService); // tu helper actual
//   let headers = new HttpHeaders({
//     Authorization: session ?? ''
//   });
//   if (useJson) headers = headers.set('Content-Type', 'application/json');
//   return headers;
// }
