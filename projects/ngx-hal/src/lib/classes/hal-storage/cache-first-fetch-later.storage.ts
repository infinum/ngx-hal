import { from, Observable, of } from 'rxjs';
import { distinctUntilChanged, mergeMap } from 'rxjs/operators';
import { HalModel } from '../../models/hal.model';
import { HalDocument } from '../hal-document';
import { EtagHalStorage } from './etag-hal-storage';

export class CacheFirstFetchLaterStorage extends EtagHalStorage {
  public makeGetRequestWrapper<T extends HalModel>(
    urls: { originalUrl: string; cleanUrl: string; urlWithParams: string },
    cachedResource: T | HalDocument<T>,
    originalGetRequest$: Observable<T | HalDocument<T>>
  ): Observable<T | HalDocument<T>> {
    if (cachedResource) {
      return from([of(cachedResource), originalGetRequest$]).pipe(
        mergeMap((request) => request),
        distinctUntilChanged(this.areModelsEqual.bind(this))
      );
    }

    return originalGetRequest$;
  }

  private areModelsEqual<T extends HalModel>(model1: T | HalDocument<T>, model2: T | HalDocument<T>): boolean {
    const localModel1 = this.getRawStorageModel(model1.uniqueModelIdentificator);
    const localModel2 = this.getRawStorageModel(model2.uniqueModelIdentificator);
    return localModel1.etag === localModel2.etag;
  }
}
