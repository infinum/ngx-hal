import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DatastoreService } from './datastore.service';
import { MockModel } from '../../mocks/mock-model';
import simpleHalDocumentJson from '../../mocks/simple-hal-document.json';
import mockModelResponseJson from '../../mocks/mock-model-response.json';

const BASE_NETWORK_URL = 'http://test.com';

describe('DatastoreService', () => {
  let httpTestingController: HttpTestingController;
  let datastoreService: DatastoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DatastoreService]
    });

    httpTestingController = TestBed.get(HttpTestingController);
    datastoreService = TestBed.get(DatastoreService);

    datastoreService.networkConfig.baseUrl = BASE_NETWORK_URL;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(datastoreService).toBeTruthy();
  });

  describe('request method', () => {
    it('should make a GET request to a fully custom URL', () => {
      const customUrl = 'test1';

      datastoreService.request('get', customUrl, {}, MockModel, false, false).subscribe();

      const req = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should make a GET request to a fully custom URL regardless if the method name is lowercase or uppercase', () => {
      const customUrl = 'test12';

      datastoreService.request('gEt', customUrl, {}, MockModel, false, false).subscribe();

      const req = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should build the host part of the URL if includeNetworkConfig is truthy', () => {
      const customUrl = 'test123';

      datastoreService.request('get', customUrl, {}, MockModel, false, true).subscribe();

      const req = httpTestingController.expectOne(`${BASE_NETWORK_URL}/${customUrl}`);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should throw an error if unsupported method is provided', () => {
      const customUrl = 'test123';
      const method = 'test_methOD';

      expect(() => {
        datastoreService.request(method, customUrl, {}, MockModel, false, false);
      }).toThrowError(`Method ${method} is not supported.`);

      httpTestingController.expectNone(customUrl);
    });

    it('should create model from fetched resource and save it in the local store', () => {
      const customUrl = 'model-endpoint-2';

      datastoreService.request('get', customUrl, {}, MockModel, true, false).subscribe((model: MockModel) => {
        expect(model instanceof MockModel).toBeTruthy();
        const modelFromDatastore = datastoreService.storage.get(model.uniqueModelIdentificator);
        expect(modelFromDatastore).toBe(model);
      });

      const req = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(mockModelResponseJson);
    });
  });
});

