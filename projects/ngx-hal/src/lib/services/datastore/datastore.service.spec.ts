import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, TestRequest } from '@angular/common/http/testing';

import { DatastoreService } from './datastore.service';
import { MockModel } from '../../mocks/mock-model';
import simpleHalDocumentJson from '../../mocks/simple-hal-document.json';
import mockModelResponseJson from '../../mocks/mock-model-response.json';
import mockModel2ResponseJson from '../../mocks/mock-model-2-response.json';
import mockModelBareMinimumResponseJson from '../../mocks/mock-model-bare-minimum-response.json';
import { MockModelWithDefaultValues } from '../../mocks/mock-model-with-default-values';
import { CustomOptions } from '../../interfaces/custom-options.interface';

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

    it('should make a GET request with a query parameter', () => {
      const customUrl = 'test1';

      const paramName = 'testParam';
      const paramValue = 'paramVal';
      const params = {
        [paramName]: paramValue
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${customUrl}?${paramName}=${encodeURIComponent(paramValue)}`);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });

    it('should make a GET request with multiple query parameters', () => {
      const customUrl = 'test1';

      const paramName = 'testParam';
      const paramValue = 'paramVal';

      const paramName2 = 'testParam2';
      const paramValue2 = 'paramVal2';

      const params = {
        [paramName]: paramValue,
        [paramName2]: paramValue2
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${customUrl}?${paramName}=${encodeURIComponent(paramValue)}&${paramName2}=${encodeURIComponent(paramValue2)}`);

      expect(req.request.method).toEqual('GET');

      req.flush(simpleHalDocumentJson);
    });


    it('should make a GET request without duplicate query parameters', () => {
      const customUrl = 'test1';

      const paramName = 'size';
      const paramValue = '100';

      const paramName2 = 'size';
      const paramValue2 = '500';

      const params = {
        [paramName]: paramValue,
        [paramName2]: paramValue2
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === customUrl;

        expect(request.method).toEqual('GET');
        expect(request.params.get(paramName2)).toEqual(paramValue2);
        expect(request.params.keys().length).toBe(1);

        return isCorrectUrl;
      });

      calls[0].flush(simpleHalDocumentJson);
    });

    it('should make a GET request with templated URL parameters', () => {
      const country = 'cro';
      const customUrl = 'test.com/{country}';

      const params = {
        country
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `test.com/${country}`;

        expect(request.method).toEqual('GET');

        return isCorrectUrl;
      });

      calls[0].flush(simpleHalDocumentJson);
    });

    it('should make a GET request with templated query parameters', () => {
      const country = 'cro';
      const id = '123';
      const customUrl = 'test.com{?country,id}';

      const params = {
        country,
        id
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === 'test.com';

        expect(request.method).toEqual('GET');
        expect(request.params.get('country')).toEqual(country);
        expect(request.params.get('id')).toEqual(id);

        return isCorrectUrl;
      });

      calls[0].flush(simpleHalDocumentJson);
    });

    it('should ignore templated query parameters if the parameter is not provided', () => {
      const country = 'cro';
      const customUrl = 'test.com{?country,id}';

      const params = {
        country
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === 'test.com';

        expect(request.method).toEqual('GET');
        expect(request.params.get('country')).toEqual(country);
        expect(request.params.get('id')).toEqual(null);

        return isCorrectUrl;
      });

      calls[0].flush(simpleHalDocumentJson);
    });

    xit('should make a GET request with a query parameter which contains a space', () => {
      const customUrl = 'test1';

      const paramName = 'testParam';
      const paramValue = 'paramVal with a space';
      const encodedParamValue = encodeURIComponent(paramValue);
      const params = {
        [paramName]: paramValue
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === customUrl;

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get(paramName)).not.toEqual(paramValue);
        expect(request.params.get(paramName)).toEqual(encodeURIComponent(paramValue));

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);
    });

    xit('should make a GET request with an encoded query parameter', () => {
      const customUrl = 'test1';

      const paramName = 'testParam';
      const paramValue = (new Date()).toUTCString();

      const params = {
        [paramName]: paramValue
      };

      datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

      const calls: Array<TestRequest> = httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === customUrl;

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get(paramName)).not.toEqual(paramValue);
        expect(request.params.get(paramName)).toEqual(encodeURIComponent(paramValue));

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);
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
      const customOptions: CustomOptions<MockModel> = {
        buildUrlFunction: () => {
          return customUrl;
        }
      };

      mockModel.save({}, customOptions).subscribe();

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      req.flush(mockModelResponseJson);
    });

    it('should make a request to a custom URL if buildUrl function is provided and model should be provided there', () => {
      const modelName = 'mockModell23';
      const mockModel = new MockModel({ name: modelName }, datastoreService);

      const customUrl = 'fully-custom-rul';
      const customOptions: CustomOptions<MockModel> = {
        buildUrlFunction: (model) => {
          return `${customUrl}/${model.name}`;
        }
      };

      mockModel.save({}, customOptions).subscribe();

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

    it('should make a POST request with all the properties from the model', () => {
      const mockModel = new MockModel({
        name: 'John',
        prop1: 'prop1 test'
      }, datastoreService);
      const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

      mockModel.save().subscribe();

      const req: TestRequest = httpTestingController.expectOne(modelUrl);

      expect(req.request.method).toEqual('POST');
      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(2);

      req.flush(mockModelResponseJson);
    });

    it('should make a POST request only with the properties which are specified in specifiedFields', () => {
      const nameModelProperty = 'John';

      const mockModel = new MockModel({
        name: nameModelProperty,
        prop1: 'prop1 test'
      }, datastoreService);
      const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

      mockModel.save({}, { specificFields: ['name'] }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(modelUrl);

      expect(req.request.method).toEqual('POST');
      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(1);
      expect(body.name).toEqual(nameModelProperty);
      expect(body.prop1).toEqual(undefined);

      req.flush(mockModelResponseJson);
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

    it('should not make a GET request for fetching a single model if noone is subscribed to it', () => {
      const spy = spyOn(datastoreService, 'findOne');

      datastoreService.findOne(
        MockModel,
        'mockModelId'
      );

      httpTestingController.expectNone(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
      expect(spy).toHaveBeenCalled();
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

    it('should make a GET request for the original model and another GET request for fetching a HasMany relationship', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['someResources']
      ).subscribe();

      const originalReq: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelResponseJson);

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/Mock2?getSomeResources=true`);
      expect(req.request.method).toEqual('GET');
    });

    it('should make a GET request for the original model and skip fetching HasMany relationship if there is no URL', () => {
      datastoreService.findOne(
        MockModel,
        'mockModelId',
        ['someEmptyResources']
      ).subscribe();

      const originalReq: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelResponseJson);

      httpTestingController.expectNone(`${BASE_NETWORK_URL}/Mock2?getSomeResources=true`);
    });

    it('should make a GET request for the original model and skip fetching HasMany relationship if there is no URL, even if local HasMany relationship has some value', () => {
      datastoreService.findOne(
        MockModelWithDefaultValues,
        'mockModelId',
        ['someResources']
      ).subscribe();

      const originalReq: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-with-default-values-endpoint/mockModelId`);
      expect(originalReq.request.method).toEqual('GET');

      originalReq.flush(mockModelBareMinimumResponseJson);
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(2);
        expect(request.params.get('page')).toEqual(pageParam);
        expect(request.params.get('q')).toEqual(qParam);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.headers.get('language')).toEqual(language);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.headers.get('language')).toEqual(languageMainRequest);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.headers.get('language')).toEqual(languageRelationshipRequest);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.headers.get('language')).toEqual(language);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.params.get('language')).toBeFalsy();

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(languageMainRequest);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.params.get('language')).toEqual(languageRelationshipRequest);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(language);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.params.get('language')).toBeFalsy();

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(globalLanguage);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(globalLanguage);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.params.get('language')).toEqual(globalLanguage);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(language);

        return isCorrectUrl;
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

        expect(request.method).toEqual('GET');
        expect(request.params.keys().length).toBe(1);
        expect(request.params.get('language')).toEqual(globalLanguage);

        return isCorrectUrl;
      });

      calls[0].flush(mockModelResponseJson);

      httpTestingController.match((request) => {
        const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/Mock2/nup52clo`;

        expect(request.method).toEqual('GET');
        expect(request.params.get('language')).toEqual(language);

        return isCorrectUrl;
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

    it('should make a PATCH after which the model property must have a new value', () => {
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

      expect(mockModel.name).toEqual(updatedName);

      req.flush(mockModelResponseJson);
    });

    it('should make a PATCH with a new property value and after that the same PATCH request with the old value', () => {
      const originalName = 'john';
      const updatedName = 'john updated';

      const mockModel = new MockModel({
        name: originalName
      }, datastoreService);

      mockModel.name = updatedName;

      mockModel.update().subscribe((p) => {
        // Set the original value back
        mockModel.name = originalName;

        mockModel.update().subscribe();

        const reqRevert: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

        expect(reqRevert.request.method).toEqual('PATCH');

        const revertBody = reqRevert.request.body;

        expect(Object.keys(revertBody).length).toEqual(1);
        expect(revertBody.name).toEqual(originalName);
        expect(mockModel.name).toEqual(originalName);

        reqRevert.flush(mockModelResponseJson);
      });

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(1);
      expect(body.name).toEqual(updatedName);
      expect(mockModel.name).toEqual(updatedName);

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

    it('should make a PATCH request with the properties from specifiedFields which are changed', () => {
      const customFunctionForPayloadTransformation = (originalPayload: object) => {
        return Object.assign({ additionalProperty: 'infiltrator' }, originalPayload);
      };

      const mockModel = new MockModel({
        name: 'john',
        prop1: 'pp'
      }, datastoreService);

      const updatedProp1 = 'prop1 value';
      mockModel.prop1 = updatedProp1;

      mockModel.update({}, { transformPayloadBeforeSave: customFunctionForPayloadTransformation }).subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('PATCH');

      const body = req.request.body;

      expect(Object.keys(body).length).toEqual(2);
      expect(body.name).toEqual(undefined);
      expect(body.prop1).toEqual(updatedProp1);
      expect(body.additionalProperty).toEqual('infiltrator');

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

  describe('delete method', () => {
    it('should make a DELETE request', () => {
      const mockModel = new MockModel({}, datastoreService);

      mockModel.delete().subscribe();

      const req: TestRequest = httpTestingController.expectOne(`${BASE_NETWORK_URL}/mock-model-endpoint`);

      expect(req.request.method).toEqual('DELETE');

      req.flush(mockModelResponseJson);
    });

    it('should make a delete request to a custom URL if buildUrl function is provided', () => {
      const mockModel = new MockModel({}, datastoreService);

      const customUrl = 'fully-custom-rul';
      const customOptions: CustomOptions<MockModel> = {
        buildUrlFunction: () => {
          return customUrl;
        }
      };

      mockModel.delete({}, customOptions).subscribe();

      const req: TestRequest = httpTestingController.expectOne(customUrl);

      req.flush(mockModelResponseJson);
    });
  });
});

