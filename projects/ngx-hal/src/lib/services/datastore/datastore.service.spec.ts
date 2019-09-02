import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DatastoreService } from './datastore.service';
import { MockModel } from '../../mocks/mock-model';
import simpleHalDocumentJson from '../../mocks/simple-hal-document.json';
import mockModelResponseJson from '../../mocks/mock-model-response.json';
import mockModel2ResponseJson from '../../mocks/mock-model-2-response.json';

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

  describe('save method', () => {
    it('should make a POST request if saving newly created model', () => {
      const mockModel = new MockModel({}, datastoreService);

      mockModel.save().subscribe();

      const req = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('POST');

      req.flush(mockModelResponseJson);
    });

    it('should make a request to a custom URL if buildUrl function is provided', () => {
      const mockModel = new MockModel({}, datastoreService);

      const customUrl = 'fully-custom-rul';

      mockModel.save({}, () => {
        return customUrl;
      }).subscribe();

      const req = httpTestingController.expectOne(customUrl);

      req.flush(mockModelResponseJson);
    });

    it('should make a request to a custom URL if buildUrl function is provided and model should be provided there', () => {
      const modelName = 'mockModell23';
      const mockModel = new MockModel({ name: modelName }, datastoreService);

      const customUrl = 'fully-custom-rul';

      mockModel.save({}, (model) => {
        return `${customUrl}/${model.name}`;
      }).subscribe();

      const req = httpTestingController.expectOne(`${customUrl}/${modelName}`);

      req.flush(mockModelResponseJson);
    });
  });

  describe('findOne method', () => {
    it('should make a GET request for fetching a single model', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId'
      ).subscribe();

      const req = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);

      expect(req.request.method).toEqual('GET');

      req.flush(mockModelResponseJson);
    });

    it('should make a GET request for fetching a single model if noone is subscribed to it', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId'
      );

      httpTestingController.expectNone(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
    });

    it('should make a GET request for the original model and another GET request for fetching a HasOne relationship', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection']
      ).subscribe();

      const originalReq = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelResponseJson);

      const req = httpTestingController.expectOne(`${BASE_NETWORK_URL}/Mock2/nup52clo`);
      expect(req.request.method).toEqual('GET');
    });
  });
});

