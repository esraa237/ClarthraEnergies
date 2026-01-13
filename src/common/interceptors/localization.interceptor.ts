import { Types } from 'mongoose';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nContext } from 'nestjs-i18n';

const NON_LOCALIZED_KEYS = new Set([
  '_id',
  'createdAt',
  'updatedAt',
  '__v',
]);

@Injectable()
export class LocalizationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const bypassHeader = request.headers['x-bypass-localization'];
    
    // If header is present and true, return raw data (all languages)
    if (bypassHeader === 'true') {
        return next.handle();
    }

    const i18n = I18nContext.current();
    const lang = i18n ? i18n.lang : 'en';

    // Using a per-request cache to avoid cross-request language leaks and handle circular refs
    const cache = new WeakMap<object, any>();

    return next.handle().pipe(
      map((data) => {
        return this.localizeData(data, lang, cache);
      }),
    );
  }

  private localizeData(data: any, lang: string, cache: WeakMap<object, any>): any {
    // Fast exits
    if (data === null || data === undefined) return data;

    // Preserve Date objects
    if (data instanceof Date) {
      return data;
    }

    // Preserve Mongoose ObjectId or MongoDB ObjectId
    if (data instanceof Types.ObjectId || (data && data._bsontype === 'ObjectID')) {
      return data.toString();
    }

    // Preserve Buffers
    if (Buffer.isBuffer(data)) {
      return data;
    }

    // Primitive
    if (typeof data !== 'object') return data;

    // Cached to handle circular references and repeated objects in the same response
    if (cache.has(data)) {
      return cache.get(data);
    }

    // Array (hot path)
    if (Array.isArray(data)) {
      const arr = new Array(data.length);
      cache.set(data, arr);

      for (let i = 0; i < data.length; i++) {
        arr[i] = this.localizeData(data[i], lang, cache);
      }
      return arr;
    }

    // Mongoose doc
    if (typeof data.toObject === 'function') {
      data = data.toObject({ virtuals: true });
    }

    // Fast localized string check (hot path)
    if (data.en !== undefined || data.fr !== undefined || data.zh !== undefined) {
      const val = data[lang] || data.en || data.fr || data.zh;
      // Note: We don't cache localized string results directly as strings aren't objects,
      // but the parent object is cached.
      if (typeof val === 'string' || val === null) return val;
    }

    // Re-check after potential toObject conversion
    if (data instanceof Date || data instanceof Types.ObjectId || (data && data._bsontype === 'ObjectID')) {
        return data instanceof Date ? data : data.toString();
    }

    const result: any = {};
    cache.set(data, result);

    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Skip known system keys
        if (NON_LOCALIZED_KEYS.has(key)) {
          result[key] = data[key];
          continue;
        }

        result[key] = this.localizeData(data[key], lang, cache);
      }
    }
    return result;
  }
}
