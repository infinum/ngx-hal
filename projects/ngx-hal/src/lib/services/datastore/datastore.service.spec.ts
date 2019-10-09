import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';

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

    datastoreService.networkConfig.globalRequestOptions = {};
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

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should make a GET request to a fully custom URL regardless if the method name is lowercase or uppercase', () => {
      const customUrl = 'test12';

      datastoreService.request('gEt', customUrl, {}, MockModel, false, false).subscribe();

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should build the host part of the URL if includeNetworkConfig is truthy', () => {
      const customUrl = 'test123';

      datastoreService.request('get', customUrl, {}, MockModel, false, true).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/${customUrl}`);

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

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      expect(req.request.method).toEqual('GET');

      req.flush(mockModelResponseJson);
    });
  });

  describe('save method', () => {
    it('should make a POST request if saving newly created model', () => {
      const mockModel = new MockModel({}, datastoreService);

      mockModel.save().subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('POST');

      req.flush(mockModelResponseJson);
    });

    it('should make a request to a custom URL if buildUrl function is provided', () => {
      const mockModel = new MockModel({}, datastoreService);

      const customUrl = 'fully-custom-rul';

      mockModel.save({}, () => {
        return customUrl;
      }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      req.flush(mockModelResponseJson);
    });

    it('should make a request to a custom URL if buildUrl function is provided and model should be provided there', () => {
      const modelName = 'mockModell23';
      const mockModel = new MockModel({ name: modelName }, datastoreService);

      const customUrl = 'fully-custom-rul';

      mockModel.save({}, (model) => {
        return `${customUrl}/${model.name}`;
      }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${customUrl}/${modelName}`);

      req.flush(mockModelResponseJson);
    });

    it('should save a newly created model to the local storage under selfLink value', () => {
      const mockModel = new MockModel({}, datastoreService);
      const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;
      const selfLink = 'http://test.com/Mock/1c5e7b79';

      mockModel.save().subscribe((savedModel: MockModel) => {
        expect(savedModel.uniqueModelIdentificator).toEqual(selfLink);
        expect(datastoreService.storage.get(savedModel.uniqueModelIdentificator)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelUrl);

      expect(req.request.method).toEqual('POST');

      req.flush(mockModelResponseJson);
    });

    it('should save a newly created model to the local storage under selfLink value together with the query parameters', () => {
      const mockModel = new MockModel({}, datastoreService);
      const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;
      const selfLink = 'http://test.com/Mock/1c5e7b79?q=title';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;

      mockModel.save().subscribe((savedModel: MockModel) => {
        expect(savedModel.uniqueModelIdentificator).toEqual(selfLink);
        expect(datastoreService.storage.get(savedModel.uniqueModelIdentificator)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelUrl);

      expect(req.request.method).toEqual('POST');

      req.flush(response);
    });

    it('should save a newly created model to the local storage under Location header value if 201 is returned', () => {
      const modelData = {
        test: 23
      };

      const mockModel = new MockModel(modelData, datastoreService);
      const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;
      const locationHeader = 'http://newLocation.com/Mock/1c5e7b79';

      mockModel.save().subscribe((savedModel: MockModel) => {
        expect(savedModel.uniqueModelIdentificator).toEqual(locationHeader);
        expect(datastoreService.storage.get(savedModel.uniqueModelIdentificator)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelUrl);

      expect(req.request.method).toEqual('POST');

      req.flush(null, { headers: { Location: locationHeader } });
    });
  });

  describe('findOne method', () => {
    it('should make a GET request for fetching a single model', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId'
      ).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);

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

      const originalReq: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelResponseJson);

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/Mock2/nup52clo`);
      expect(req.request.method).toEqual('GET');
    });

    it('should make a GET request with custom parameters', () => {
      const pageParam = '3';
      const qParam = 'cool';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        [],
        {
          params: {
            page: pageParam,
            q: qParam
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('page') === pageParam && request.params.get('q') === qParam;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 2;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);
    });

    it('should make a GET request with custom headers', () => {
      const language = 'en';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        [],
        {
          headers: {
            language
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectHeaders: boolean = request.headers.get('language') === language;

        return isCorrectUrl && isCorrectMethod && hasCorrectHeaders;
      });

      calls[0].flush(mockModelResponseJson);
    });

    it('should pass custom headers to subsequent requests', () => {
      const languageMainRequest = 'en';
      const languageRelationshipRequest = 'us';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection'],
        {
          headers: {
            language: languageMainRequest
          }
        },
        undefined,
        {
          headers: {
            language: languageRelationshipRequest
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectHeaders: boolean = request.headers.get('language') === languageMainRequest;

        return isCorrectUrl && isCorrectMethod && hasCorrectHeaders;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectHeaders: boolean = request.headers.get('language') === languageRelationshipRequest;

        return isCorrectUrl && isCorrectMethod && hasCorrectHeaders;
      });
    });

    it('should not pass custom headers to subsequent requests', () => {
      const language = 'en';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection'],
        {
          headers: {
            language
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectHeaders: boolean = request.headers.get('language') === language;

        return isCorrectUrl && isCorrectMethod && hasCorrectHeaders;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const languageParamNotSet: boolean = !request.headers.get('language');

        return isCorrectUrl && isCorrectMethod && languageParamNotSet;
      });
    });

    it('should pass custom params to subsequent requests', () => {
      const languageMainRequest = 'en';
      const languageRelationshipRequest = 'us';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection'],
        {
          params: {
            language: languageMainRequest
          }
        },
        undefined,
        {
          params: {
            language: languageRelationshipRequest
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === languageMainRequest;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectParams: boolean = request.params.get('language') === languageRelationshipRequest;

        return isCorrectUrl && isCorrectMethod && hasCorrectParams;
      });
    });

    it('should not pass custom params to subsequent requests', () => {
      const language = 'en';

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection'],
        {
          params: {
            language
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === language;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const languageParamNotSet: boolean = !request.params.get('language');

        return isCorrectUrl && isCorrectMethod && languageParamNotSet;
      });
    });

    it('should make a GET request to a custom URL', () => {
      const customUrl = 'cool-custom-url';
      datastoreService.findOne(
        MockModel,
        'mockModelId',
        [],
        {},
        customUrl
      ).subscribe();

      const originalReq: TestRequest = httpTestingController.expectOne(customUrl);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelResponseJson);
    });

    it('should use the default Datastore params if params are not provided', () => {
      const globalLanguage = 'en';
      datastoreService.networkConfig.globalRequestOptions = { params: { language: globalLanguage } };

      datastoreService.findOne(
        MockModel,
        'mockModelId'
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === globalLanguage;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);
    });

    it('should use the default Datastore params if params are not provided for subsequent requests', () => {
      const globalLanguage = 'en';
      datastoreService.networkConfig.globalRequestOptions = { params: { language: globalLanguage } };

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection']
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === globalLanguage;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const correctLanguageParam: boolean = request.params.get('language') === globalLanguage;

        return isCorrectUrl && isCorrectMethod && correctLanguageParam;
      });
    });

    it('should use the provided params instead of the default Datastore params', () => {
      const globalLanguage = 'en';
      const language = 'us';
      datastoreService.networkConfig.globalRequestOptions = { params: { language: globalLanguage } };

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        [],
        {
          params: {
            language
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === language;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);
    });

    it('should use the provided params instead of the default Datastore params for subsequent requests', () => {
      const globalLanguage = 'en';
      const language = 'us';
      datastoreService.networkConfig.globalRequestOptions = { params: { language: globalLanguage } };

      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['mockModel2Connection'],
        {},
        undefined,
        {
          params: {
            language
          }
        }
      ).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const hasCorrectQueryParams: boolean = request.params.get('language') === globalLanguage;
        const hasCorrectNumberOfParams: boolean = request.params.keys().length === 1;

        return isCorrectUrl && isCorrectMethod && hasCorrectQueryParams && hasCorrectNumberOfParams;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;
        const isCorrectMethod: boolean = request.method === 'GET';
        const correctLanguageParam: boolean = request.params.get('language') === language;

        return isCorrectUrl && isCorrectMethod && correctLanguageParam;
      });
    });

    it('should save fetched model in the local storage under model.selfLink key', () => {
      const selfLink = 'http://mydomain.com/Eye/123';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;

      datastoreService.findOne(
        MockModel,
        'mockModelId1'
      ).subscribe((fetchedModel) => {
        expect(fetchedModel.selfLink).toEqual(selfLink);
        expect(fetchedModel.uniqueModelIdentificator).toEqual(selfLink);
        expect(datastoreService.storage.get(fetchedModel.uniqueModelIdentificator)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId1`);

      expect(req.request.method).toEqual('GET');

      req.flush(response);
    });

    it('should save fetched model in the local storage under the endpoint value key', () => {
      const selfLink = 'http://mydomain.com/Eye/123';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;
      const modelId = '774732';
      const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;

      datastoreService.findOne(
        MockModel,
        modelId
      ).subscribe((fetchedModel) => {
        expect(datastoreService.storage.get(modelEndpoint)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelEndpoint);

      expect(req.request.method).toEqual('GET');

      req.flush(response);
    });

    it('should save fetched model in the local storage under the endpoint value key and under model.selfLink key', () => {
      const selfLink = 'http://mydomain.com/Eye/123';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;
      const modelId = '774732';
      const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;

      datastoreService.findOne(
        MockModel,
        modelId
      ).subscribe(() => {
        expect(datastoreService.storage.get(modelEndpoint)).toBeTruthy();
        expect(datastoreService.storage.get(selfLink)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelEndpoint);

      expect(req.request.method).toEqual('GET');

      req.flush(response);
    });

    it('should take query params into consideration while saving fetched model in the local storage', () => {
      const selfLink = 'http://mydomain.com/Eye/123';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;
      const modelId = '774732';
      const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;
      const params = {
        q: 'title'
      };
      const modelEndpointWithParams = `${modelEndpoint}?q=${params.q}`;

      datastoreService.findOne(
        MockModel,
        modelId,
        [],
        {
          params
        }
      ).subscribe(() => {
        expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
        expect(datastoreService.storage.get(modelEndpoint)).toBeFalsy();
        expect(datastoreService.storage.get(selfLink)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(modelEndpointWithParams);

      expect(req.request.method).toEqual('GET');

      req.flush(response);
    });

    it('should use query params alphabetically while using them as a key for the local storage', () => {
      const selfLink = 'http://mydomain.com/Eye/123';
      const response = JSON.parse(JSON.stringify(mockModelResponseJson));
      response._links.self.href = selfLink;
      const modelId = '774732';
      const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;
      const params = {
        b: 'btitle',
        z: 'ztitle',
        a: 'atitle'
      };
      const modelEndpointWithParams = `${modelEndpoint}?a=${params.a}&b=${params.b}&z=${params.z}`;

      datastoreService.findOne(
        MockModel,
        modelId,
        [],
        {
          params
        }
      ).subscribe(() => {
        expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
      });

      const req: TestRequest = httpTestingController.expectOne(`${modelEndpoint}?b=${params.b}&z=${params.z}&a=${params.a}`);

      expect(req.request.method).toEqual('GET');

      req.flush(response);
    });
  });

  describe('update method', () => {
    it('should make a PATCH request', () => {
      const mockModel = new MockModel({
        test: 123
      }, datastoreService);

      mockModel.update().subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      req.flush(mockModelResponseJson);
    });

    it('should make a PATCH request only with the properties which are changed', () => {
      const mockModel = new MockModel({
        name: 'john'
      }, datastoreService);

      const updatedName = 'john updated';
      mockModel.name = updatedName;

      mockModel.update().subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(1);
      expect(body.name).toEqual(updatedName);

      req.flush(mockModelResponseJson);
    });

    it('should make a PATCH request with an empty object is nothing is changed', () => {
      const mockModel = new MockModel({
        name: 'john'
      }, datastoreService);

      mockModel.update().subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(0);

      req.flush(mockModelResponseJson);
    });


    it('should make a PATCH request only with the properties which are changed and specified in specifiedFields', () => {
      const mockModel = new MockModel({
        name: 'john'
      }, datastoreService);

      const updatedProp1 = 'prop1 value';
      mockModel.prop1 = updatedProp1;

      mockModel.update({}, { specificFields: ['prop1'] }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(1);
      expect(body.name).toEqual(undefined);
      expect(body.prop1).toEqual(updatedProp1);

      req.flush(mockModelResponseJson);
    });

    it('should make a PATCH request with the properties from specifiedFields which are changed', () => {
      const mockModel = new MockModel({
        name: 'john',
        prop1: 'pp'
      }, datastoreService);

      const updatedProp1 = 'prop1 value';
      mockModel.prop1 = updatedProp1;

      mockModel.update({}, { specificFields: ['prop1', 'name'] }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(1);
      expect(body.name).toEqual(undefined);
      expect(body.prop1).toEqual(updatedProp1);

      req.flush(mockModelResponseJson);
    });

    it('should make a PATCH request with an empty object if some specific fields are specified but nothing is changed', () => {
      const mockModel = new MockModel({
        name: 'john'
      }, datastoreService);

      mockModel.update({}, { specificFields: ['name'] }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(0);
      expect(body.name).toEqual(undefined);

      req.flush(mockModelResponseJson);
    });
  });

  xdescribe('find method', () => {
    it('should fetch embedded list items', () => {

    });

    it('should pass proper request options to the requests for fetching embedded list items', () => {

    });

    it('should fetch the relationships of embedded list items', () => {

    });

    it('should pass proper request options while fetching the relationships of embedded list items', () => {

    });
  });
});

