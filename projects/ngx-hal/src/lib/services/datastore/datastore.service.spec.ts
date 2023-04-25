import {
	HttpClientTestingModule,
	HttpTestingController,
	TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpParams } from '@angular/common/http';
import { HalDocument } from '../../classes/hal-document';
import { LINKS_PROPERTY_NAME } from '../../constants/hal.constant';
import { CustomOptions } from '../../interfaces/custom-options.interface';
import { CarModel } from '../../mocks/car.mock.model';
import carsResponseJson from '../../mocks/cars-response.json';
import modelWithCustomNamesResponseJson from '../../mocks/model-with-custom-names-response.json';
import listItemsWithDifferentListNamesResponseJson from '../../mocks/list-items-with-different-list-names-response.json';
import mockListWithEmbeddedJson from '../../mocks/mock-list-with-embedded.json';
import { MockModel } from '../../mocks/mock-model';
import { MockModel2 } from '../../mocks/mock-model-2';
import mockModel2ResponseJson from '../../mocks/mock-model-2-response.json';
import mockModelBareMinimumResponseJson from '../../mocks/mock-model-bare-minimum-response.json';
import mockModelResponseJson from '../../mocks/mock-model-response.json';
import { MockTemplatedModel } from '../../mocks/mock-model-templated';
import { MockModelWithDefaultValues } from '../../mocks/mock-model-with-default-values';
import simpleHalDocumentJson from '../../mocks/simple-hal-document.json';
import { RelationshipRequestDescriptor } from '../../types/relationship-request-descriptor.type';
import { DatastoreService } from './datastore.service';
import { MockModelWithCustomNames } from '../../mocks/mock-model-with-custom-names';
import { MockModelAttributes } from '../../mocks/mock-model-attributes';
import { MockAttributesRel } from '../../mocks/mock-model-attributes-rel';
import { MockChildModel } from '../../mocks/mock-child-model';
import { MockChildModel2 } from '../../mocks/mock-child-model-2';

const BASE_NETWORK_URL = 'http://test.com';

describe('DatastoreService', () => {
	let httpTestingController: HttpTestingController;
	let datastoreService: DatastoreService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [HttpClientTestingModule],
			providers: [DatastoreService],
		});

		httpTestingController = TestBed.inject(HttpTestingController);
		datastoreService = TestBed.inject(DatastoreService);

		datastoreService.networkConfig.globalRequestOptions = {};
		datastoreService.networkConfig.baseUrl = BASE_NETWORK_URL;
	});

	afterEach(() => {
		httpTestingController.verify();
	});

	it('should be created', () => {
		expect(datastoreService).toBeTruthy();
	});

	describe('HAL model creation', () => {
		let carModel: CarModel;
		const carName = 'nice car';
		const partName = 'engine';
		const companyName = 'coolCompanyLtd';

		beforeEach(() => {
			carModel = new CarModel(
				{
					name: carName,
					prentCompany: new MockModel2({ name: companyName }, datastoreService),
					parts: [new MockModel2({ name: partName }, datastoreService)],
				},
				datastoreService,
			);
		});

		it('should create a HAL model from a raw response with different attribute property names', () => {
			expect(carModel.carName).toBeDefined();
			expect(carModel.carName).toBe(carName);
		});

		// TODO implement
		xit('should create a HAL model from a raw response with different hasOne property names', () => {
			expect(carModel.company).toBeDefined();
			expect(carModel.company.name).toBe(companyName);
		});

		// TODO implement
		xit('should create a HAL model from a raw response with different hasMany property names', () => {
			expect(carModel.carParts).toBeDefined();
			expect(carModel.carParts.length).toBe(1);
			expect(carModel.carParts[0].name).toBe(partName);
		});

		it('should return property metadata of the most specific class', () => {
			const mockModel = new MockChildModel(
				{
					name: 'mock child model',
					mockModel2Connection: new MockChildModel2({ name: 'mock 2 child' }, datastoreService),
				},
				datastoreService,
			);

			expect(mockModel.getPropertyData('mockModel2Connection').propertyClass).toBe(MockChildModel2);

			const mockModel2ConnectionMetadata = mockModel['hasOneProperties']
				.map((property) => property.name)
				.filter((name) => name === 'mockModel2Connection');
			expect(mockModel2ConnectionMetadata.length).toBe(1);
		});
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

			datastoreService
				.request('get', customUrl, {}, MockModel, true, false)
				.subscribe((model: MockModel) => {
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
				[paramName]: paramValue,
			};

			datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${customUrl}?${paramName}=${encodeURIComponent(paramValue)}`,
			);

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
				[paramName2]: paramValue2,
			};

			datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${customUrl}?${paramName}=${encodeURIComponent(
					paramValue,
				)}&${paramName2}=${encodeURIComponent(paramValue2)}`,
			);

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
				[paramName2]: paramValue2,
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
				country,
			};

			datastoreService.request('get', customUrl, { params }, MockModel, false, false).subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === `test.com/${country}`;

				expect(request.method).toEqual('GET');

				return isCorrectUrl;
			});

			calls[0].flush(simpleHalDocumentJson);
		});

		it('should make a GET request with templated URL parameters passed as HttpParams', () => {
			const country = 'cro';
			const customUrl = 'test.com/{country}';

			const params = new HttpParams().set('country', country);

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
				id,
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
				country,
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
				[paramName]: paramValue,
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
			const paramValue = new Date().toUTCString();

			const params = {
				[paramName]: paramValue,
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

	describe('Attribute decorator', () => {
		beforeEach(() => {
			datastoreService.modelTypes = [MockAttributesRel];
		});

		it('should create an instance of a class provided via useClass property', () => {
			const customUrl = 'model-endpoint-2';

			datastoreService
				.request('get', customUrl, {}, MockModelAttributes, true, false)
				.subscribe((model: MockModelAttributes) => {
					expect(model.prop2 instanceof MockModel2).toBeTruthy();
				});

			const req: TestRequest = httpTestingController.expectOne(customUrl);

			expect(req.request.method).toEqual('GET');

			req.flush(mockModelResponseJson);
		});

		it('should transform a value of property before creating a model instance', () => {
			const customUrl = 'model-endpoint-2';

			datastoreService
				.request('get', customUrl, {}, MockModelAttributes, true, false)
				.subscribe((model: MockModelAttributes) => {
					expect(model.prop3).toBe('transformed name');
				});

			const req: TestRequest = httpTestingController.expectOne(customUrl);

			expect(req.request.method).toEqual('GET');

			req.flush(mockModelResponseJson);
		});

		it('should create an instance of a class provided via useClass property and transform response value before using it', () => {
			const customUrl = 'model-endpoint-2';

			datastoreService
				.request('get', customUrl, {}, MockModelAttributes, true, false)
				.subscribe((model: MockModelAttributes) => {
					expect(model.prop4 instanceof MockModel2).toBeTruthy();
					expect(model.prop4.name).toBe('transformed name');
				});

			const req: TestRequest = httpTestingController.expectOne(customUrl);

			expect(req.request.method).toEqual('GET');

			req.flush(mockModelResponseJson);
		});

		it('should create an instance of a class provided via useClass property provided as a string', () => {
			const customUrl = 'model-endpoint-2';

			datastoreService
				.request('get', customUrl, {}, MockModelAttributes, true, false)
				.subscribe((model: MockModelAttributes) => {
					expect(model.prop5 instanceof MockAttributesRel).toBeTruthy();
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

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('POST');

			req.flush(mockModelResponseJson);
		});

		it('should make a request to a custom URL if buildUrl function is provided', () => {
			const mockModel = new MockModel({}, datastoreService);

			const customUrl = 'fully-custom-rul';
			const customOptions: CustomOptions<MockModel> = {
				buildUrlFunction: () => {
					return customUrl;
				},
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
				},
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
				test: 23,
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
			const mockModel = new MockModel(
				{
					name: 'John',
					prop1: 'prop1 test',
				},
				datastoreService,
			);
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

			const mockModel = new MockModel(
				{
					name: nameModelProperty,
					prop1: 'prop1 test',
				},
				datastoreService,
			);
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

		it('should make a POST request only with the properties which are specified in specifiedFields (links included)', () => {
			const nameModelProperty = 'John';

			const mockModel1: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			mockModel1.selfLink = '/mockModel2/2';
			const mockModel2: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			mockModel2.selfLink = '/mockModel2/3';

			const mockModel = new MockModel(
				{
					name: nameModelProperty,
					mockModel2Connection: mockModel1,
					someResources: [mockModel2],
				},
				datastoreService,
			);
			mockModel.mockModel2Connection = mockModel1;
			mockModel.someResources = [mockModel2];

			const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

			mockModel.save({}, { specificFields: ['name', 'someResources'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(2);
			expect(body.name).toEqual(nameModelProperty);
			expect(body[LINKS_PROPERTY_NAME]).toBeDefined();
			expect(body[LINKS_PROPERTY_NAME].someResources).toBeDefined();
			expect(body[LINKS_PROPERTY_NAME].mockModel2Connection).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should make a POST request only with the properties which are specified in specifiedFields (links excluded if there are no relationships)', () => {
			const nameModelProperty = 'John';

			const mockModel1: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			mockModel1.selfLink = '/mockModel2/2';
			const mockModel2: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			mockModel2.selfLink = '/mockModel2/3';

			const mockModel = new MockModel(
				{
					name: nameModelProperty,
					mockModel2Connection: mockModel1,
					someResources: [mockModel2],
				},
				datastoreService,
			);
			mockModel.mockModel2Connection = mockModel1;
			mockModel.someResources = [mockModel2];

			const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

			mockModel.save({}, { specificFields: ['name'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(nameModelProperty);
			expect(body[LINKS_PROPERTY_NAME]).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names and it should not use external attribute name as identificator', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/3';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['name'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(0);
			expect(body[LINKS_PROPERTY_NAME]).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names when doing POST request with attribute specific fields', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/3';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['carName'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(carName);
			expect(body[LINKS_PROPERTY_NAME]).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names and it should not use external hasOne name as identificator', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/3';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['parentCompany'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(0);
			expect(body[LINKS_PROPERTY_NAME]).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names when doing POST request with hasOne specific fields', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/3';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['company'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body[LINKS_PROPERTY_NAME]).toBeDefined();
			expect(Object.keys(body[LINKS_PROPERTY_NAME]).length).toEqual(1);

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names and it should not use external hasMany name as identificator', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/3';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['parts'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(0);
			expect(body[LINKS_PROPERTY_NAME]).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should take into consideration external property names when doing POST request with hasMany specific fields', () => {
			const carName = 'nice car';
			const partName = 'engine';
			const companyName = 'coolCompanyLtd';

			const companyModel = new MockModel2({ name: companyName }, datastoreService);
			companyModel.selfLink = '/mockModel2/2';
			const partsModel = new MockModel2({ name: partName }, datastoreService);
			partsModel.selfLink = '/mockModel2/2';

			const carModel = new CarModel(
				{
					name: carName,
					prentCompany: companyModel,
					parts: [partsModel],
				},
				datastoreService,
			);
			carModel.company = companyModel;
			carModel.carParts = [partsModel];

			const modelUrl = `${BASE_NETWORK_URL}/car`;

			carModel.save({}, { specificFields: ['carParts'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body[LINKS_PROPERTY_NAME]).toBeDefined();
			expect(Object.keys(body[LINKS_PROPERTY_NAME]).length).toEqual(1);

			req.flush(mockModelResponseJson);
		});
	});

	describe('findOne method', () => {
		it('should make a GET request for fetching a single model', () => {
			datastoreService.findOne(MockModel, 'mockModelId').subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);

			expect(req.request.method).toEqual('GET');

			req.flush(mockModelResponseJson);
		});

		it('should not make a GET request for fetching a single model if noone is subscribed to it', () => {
			const spy = spyOn(datastoreService, 'findOne');

			datastoreService.findOne(MockModel, 'mockModelId');

			httpTestingController.expectNone(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);
			expect(spy).toHaveBeenCalled();
		});

		it('should make a GET request for the original model and another GET request for fetching a HasOne relationship', () => {
			datastoreService.findOne(MockModel, 'mockModelId', ['mockModel2Connection']).subscribe();

			const originalReq: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);
			expect(originalReq.request.method).toEqual('GET');

			originalReq.flush(mockModelResponseJson);

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock2/nup52clo`,
			);
			expect(req.request.method).toEqual('GET');

			req.flush(mockModel2ResponseJson);
		});

		it('should make a GET request for the original model and another GET request for fetching a HasMany relationship', () => {
			datastoreService.findOne(MockModel, 'mockModelId', ['someResources']).subscribe();

			const originalReq: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);
			expect(originalReq.request.method).toEqual('GET');

			originalReq.flush(mockModelResponseJson);

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock2?getSomeResources=true`,
			);
			expect(req.request.method).toEqual('GET');
		});

		it('should make a GET request for the original model and skip fetching HasMany relationship if there is no URL', () => {
			datastoreService.findOne(MockModel, 'mockModelId', ['someEmptyResources']).subscribe();

			const originalReq: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);
			expect(originalReq.request.method).toEqual('GET');

			originalReq.flush(mockModelResponseJson);

			httpTestingController.expectNone(`${BASE_NETWORK_URL}/Mock2?getSomeResources=true`);
		});

		it('should make a GET request for the original model and skip fetching HasMany relationship if there is no URL, even if local HasMany relationship has some value', () => {
			datastoreService
				.findOne(MockModelWithDefaultValues, 'mockModelId', ['someResources'])
				.subscribe();

			const originalReq: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-with-default-values-endpoint/mockModelId`,
			);
			expect(originalReq.request.method).toEqual('GET');

			originalReq.flush(mockModelBareMinimumResponseJson);
		});

		it('should make a GET request with custom parameters', () => {
			const pageParam = '3';
			const qParam = 'cool';

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					params: {
						page: pageParam,
						q: qParam,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					headers: {
						language,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.headers.get('language')).toEqual(language);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should pass custom headers to subsequent requests', () => {
			const languageMainRequest = 'en';
			const languageRelationshipRequest = 'us';

			datastoreService
				.findOne(
					MockModel,
					'mockModelId',
					['mockModel2Connection'],
					{
						headers: {
							language: languageMainRequest,
						},
					},
					undefined,
					{
						headers: {
							language: languageRelationshipRequest,
						},
					},
				)
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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

			datastoreService
				.findOne(MockModel, 'mockModelId', ['mockModel2Connection'], {
					headers: {
						language,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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

			datastoreService
				.findOne(
					MockModel,
					'mockModelId',
					['mockModel2Connection'],
					{
						params: {
							language: languageMainRequest,
						},
					},
					undefined,
					{
						params: {
							language: languageRelationshipRequest,
						},
					},
				)
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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

			datastoreService
				.findOne(MockModel, 'mockModelId', ['mockModel2Connection'], {
					params: {
						language,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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
			datastoreService.findOne(MockModel, 'mockModelId', [], {}, customUrl).subscribe();

			const originalReq: TestRequest = httpTestingController.expectOne(customUrl);
			expect(originalReq.request.method).toEqual('GET');

			originalReq.flush(mockModelResponseJson);
		});

		it('should use the default Datastore params if params are not provided', () => {
			const globalLanguage = 'en';
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService.findOne(MockModel, 'mockModelId').subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.params.keys().length).toBe(1);
				expect(request.params.get('language')).toEqual(globalLanguage);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should use the default Datastore params if params are not provided for subsequent requests', () => {
			const globalLanguage = 'en';
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService.findOne(MockModel, 'mockModelId', ['mockModel2Connection']).subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					params: {
						language,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.params.keys().length).toBe(1);
				expect(request.params.get('language')).toEqual(language);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should not mutate globalRequestOptions', () => {
			const globalLanguage = 'en';
			const testParam1 = 'testParam1Value';
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					params: {
						testParam1,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.params.get('testParam1')).toEqual(testParam1);

				// Global headers should not change
				expect(Object.keys(datastoreService.networkConfig.globalRequestOptions).length).toEqual(1);
				expect(
					Object.keys(datastoreService.networkConfig.globalRequestOptions.params).length,
				).toEqual(1);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should send both globalRequestOptions and local params in a payload', () => {
			const globalLanguage = 'en';
			const testParam1 = 'testParam1Value';
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					params: {
						testParam1,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.params.keys().length).toBe(2);
				expect(request.params.get('language')).toEqual(globalLanguage);
				expect(request.params.get('testParam1')).toEqual(testParam1);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should send both globalRequestOptions and local headers in a payload', () => {
			const testHeader1 = 'testHeader1Value';
			const testParam1 = 'testParam1Value';
			datastoreService.networkConfig.globalRequestOptions = {
				headers: { testHeader1 },
			};

			datastoreService
				.findOne(MockModel, 'mockModelId', [], {
					headers: {
						testParam1,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

				expect(request.method).toEqual('GET');
				expect(request.headers.keys().length).toBe(2);
				expect(request.headers.get('testHeader1')).toEqual(testHeader1);
				expect(request.headers.get('testParam1')).toEqual(testParam1);

				// Global headers should not change
				expect(Object.keys(datastoreService.networkConfig.globalRequestOptions).length).toEqual(1);
				expect(
					Object.keys(datastoreService.networkConfig.globalRequestOptions.headers).length,
				).toEqual(1);

				return isCorrectUrl;
			});

			calls[0].flush(mockModelResponseJson);
		});

		it('should not send unsaved has many relationships in payload', () => {
			const nameModelProperty = 'John';

			const savedMockModel1: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			savedMockModel1.selfLink = '/mockModel2/2';
			const unsavedMockModel2: MockModel2 = new MockModel2({ name: '' }, datastoreService);

			const mockModel = new MockModel(
				{
					name: nameModelProperty,
					mockModel2Connection: savedMockModel1,
					someResources: [unsavedMockModel2],
				},
				datastoreService,
			);
			mockModel.mockModel2Connection = savedMockModel1;
			mockModel.someResources = [unsavedMockModel2];

			const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

			mockModel.save({}).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(3);
			expect(body.name).toEqual(nameModelProperty);
			expect(body[LINKS_PROPERTY_NAME]).toBeDefined();
			expect(body[LINKS_PROPERTY_NAME].someResources).toBeUndefined();
			expect(body[LINKS_PROPERTY_NAME].mockModel2Connection).toBeDefined();

			req.flush(mockModelResponseJson);
		});

		it('should not send unsaved has one relationships in payload', () => {
			const nameModelProperty = 'John';

			const savedMockModel1: MockModel2 = new MockModel2({ name: '' }, datastoreService);
			savedMockModel1.selfLink = '/mockModel2/2';
			const unsavedMockModel2: MockModel2 = new MockModel2({ name: '' }, datastoreService);

			const mockModel = new MockModel(
				{
					name: nameModelProperty,
					mockModel2Connection: unsavedMockModel2,
					someResources: [savedMockModel1],
				},
				datastoreService,
			);
			mockModel.mockModel2Connection = unsavedMockModel2;
			mockModel.someResources = [savedMockModel1];

			const modelUrl = `${BASE_NETWORK_URL}/mock-model-endpoint`;

			mockModel.save({}).subscribe();

			const req: TestRequest = httpTestingController.expectOne(modelUrl);

			expect(req.request.method).toEqual('POST');
			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(3);
			expect(body.name).toEqual(nameModelProperty);
			expect(body[LINKS_PROPERTY_NAME]).toBeDefined();
			expect(body[LINKS_PROPERTY_NAME].someResources).toBeDefined();
			expect(body[LINKS_PROPERTY_NAME].mockModel2Connection).toBeUndefined();

			req.flush(mockModelResponseJson);
		});

		it('should use the provided params instead of the default Datastore params for subsequent requests', () => {
			const globalLanguage = 'en';
			const language = 'us';
			datastoreService.networkConfig.globalRequestOptions = {
				params: { language: globalLanguage },
			};

			datastoreService
				.findOne(MockModel, 'mockModelId', ['mockModel2Connection'], {}, undefined, {
					params: {
						language,
					},
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`;

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

			datastoreService.findOne(MockModel, 'mockModelId1').subscribe((fetchedModel) => {
				expect(fetchedModel.selfLink).toEqual(selfLink);
				expect(fetchedModel.uniqueModelIdentificator).toEqual(selfLink);
				expect(datastoreService.storage.get(fetchedModel.uniqueModelIdentificator)).toBeTruthy();
			});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId1`,
			);

			expect(req.request.method).toEqual('GET');

			req.flush(response);
		});

		it('should save fetched model in the local storage under the endpoint value key', () => {
			const selfLink = 'http://mydomain.com/Eye/123';
			const response = JSON.parse(JSON.stringify(mockModelResponseJson));
			response._links.self.href = selfLink;
			const modelId = '774732';
			const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;

			datastoreService.findOne(MockModel, modelId).subscribe((fetchedModel) => {
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

			datastoreService.findOne(MockModel, modelId).subscribe(() => {
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
				q: 'title',
			};
			const modelEndpointWithParams = `${modelEndpoint}?q=${params.q}`;

			datastoreService
				.findOne(MockModel, modelId, [], {
					params,
				})
				.subscribe(() => {
					expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
					expect(datastoreService.storage.get(modelEndpoint)).toBeFalsy();
					expect(datastoreService.storage.get(selfLink)).toBeTruthy();
				});

			const req: TestRequest = httpTestingController.expectOne(modelEndpointWithParams);

			expect(req.request.method).toEqual('GET');

			req.flush(response);
		});

		it('should take query params into consideration when params are provided as HttpParams instance', () => {
			const selfLink = 'http://mydomain.com/Eye/123';
			const response = JSON.parse(JSON.stringify(mockModelResponseJson));
			response._links.self.href = selfLink;
			const modelId = '774732';
			const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;
			const params = new HttpParams().set('q', 'title');

			const modelEndpointWithParams = `${modelEndpoint}?q=title`;

			datastoreService
				.findOne(MockModel, modelId, [], {
					params,
				})
				.subscribe(() => {
					expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
					expect(datastoreService.storage.get(modelEndpoint)).toBeFalsy();
					expect(datastoreService.storage.get(selfLink)).toBeTruthy();
				});

			const req: TestRequest = httpTestingController.expectOne(modelEndpointWithParams);

			expect(req.request.method).toEqual('GET');

			req.flush(response);
		});

		it('should take array query params into consideration when params are provided as HttpParams instance', () => {
			const selfLink = 'http://mydomain.com/Eye/123';
			const response = JSON.parse(JSON.stringify(mockModelResponseJson));
			response._links.self.href = selfLink;
			const modelId = '774732';
			const modelEndpoint = `${BASE_NETWORK_URL}/mock-model-endpoint/${modelId}`;
			const params = new HttpParams().append('q', '1').append('q', '2');

			const modelEndpointWithParams = `${modelEndpoint}?q=1,2`;

			datastoreService
				.findOne(MockModel, modelId, [], {
					params,
				})
				.subscribe(() => {
					expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
					expect(datastoreService.storage.get(modelEndpoint)).toBeFalsy();
					expect(datastoreService.storage.get(selfLink)).toBeTruthy();
				});

			datastoreService
				.request('get', modelEndpoint, { params }, MockModel, false, false)
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === modelEndpoint;

				expect(request.method).toEqual('GET');

				const qParam = request.params.get('q');

				expect(request.params.keys().length).toEqual(1);
				expect(qParam).toEqual(['1', '2'].sort().join(','));

				return isCorrectUrl;
			});

			calls[0].flush(response);
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
				a: 'atitle',
			};
			const modelEndpointWithParams = `${modelEndpoint}?a=${params.a}&b=${params.b}&z=${params.z}`;

			datastoreService
				.findOne(MockModel, modelId, [], {
					params,
				})
				.subscribe(() => {
					expect(datastoreService.storage.get(modelEndpointWithParams)).toBeTruthy();
				});

			const req: TestRequest = httpTestingController.expectOne(
				`${modelEndpoint}?b=${params.b}&z=${params.z}&a=${params.a}`,
			);

			expect(req.request.method).toEqual('GET');

			req.flush(response);
		});
	});

	describe('update method', () => {
		it('should make a PATCH request', () => {
			const mockModel = new MockModel(
				{
					test: 123,
				},
				datastoreService,
			);

			mockModel.update().subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH request only with the properties which are changed', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
				},
				datastoreService,
			);

			const updatedName = 'john updated';
			mockModel.name = updatedName;

			mockModel.update().subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(updatedName);

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH after which the model property must have a new value', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
				},
				datastoreService,
			);

			const updatedName = 'john updated';
			mockModel.name = updatedName;

			mockModel.update().subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

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

			const mockModel = new MockModel(
				{
					name: originalName,
				},
				datastoreService,
			);

			mockModel.name = updatedName;

			mockModel.update().subscribe((p) => {
				// Set the original value back
				mockModel.name = originalName;

				mockModel.update().subscribe();

				const reqRevert: TestRequest = httpTestingController.expectOne(
					`${BASE_NETWORK_URL}/mock-model-endpoint`,
				);

				expect(reqRevert.request.method).toEqual('PATCH');

				const revertBody = reqRevert.request.body;
				expect(Object.keys(revertBody).length).toEqual(1);
				expect(revertBody.name).toEqual(originalName);
				expect(mockModel.name).toEqual(originalName);

				reqRevert.flush(mockModelResponseJson);
			});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(updatedName);
			expect(mockModel.name).toEqual(updatedName);

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH request with an empty object is nothing is changed', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
				},
				datastoreService,
			);

			mockModel.update().subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(0);

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH request only with the properties which are changed and specified in specifiedFields', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
				},
				datastoreService,
			);

			const updatedProp1 = 'prop1 value';
			mockModel.prop1 = updatedProp1;

			mockModel.update({}, { specificFields: ['prop1'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(undefined);
			expect(body.prop1).toEqual(updatedProp1);

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH request with the properties from specifiedFields which are changed', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
					prop1: 'pp',
				},
				datastoreService,
			);

			const updatedProp1 = 'prop1 value';
			mockModel.prop1 = updatedProp1;

			mockModel.update({}, { specificFields: ['prop1', 'name'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(1);
			expect(body.name).toEqual(undefined);
			expect(body.prop1).toEqual(updatedProp1);

			req.flush(mockModelResponseJson);
		});

		it('should make a PATCH request with an empty object if some specific fields are specified but nothing is changed', () => {
			const mockModel = new MockModel(
				{
					name: 'john',
				},
				datastoreService,
			);

			mockModel.update({}, { specificFields: ['name'] }).subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

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

			const mockModel = new MockModel(
				{
					name: 'john',
					prop1: 'pp',
				},
				datastoreService,
			);

			const updatedProp1 = 'prop1 value';
			mockModel.prop1 = updatedProp1;

			mockModel
				.update(
					{},
					{
						transformPayloadBeforeSave: customFunctionForPayloadTransformation,
					},
				)
				.subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('PATCH');

			const body = req.request.body;

			expect(Object.keys(body).length).toEqual(2);
			expect(body.name).toEqual(undefined);
			expect(body.prop1).toEqual(updatedProp1);
			expect(body.additionalProperty).toEqual('infiltrator');

			req.flush(mockModelResponseJson);
		});
	});

	describe('find method', () => {
		xit('should fetch embedded list items', () => {});

		xit('should pass proper request options to the requests for fetching embedded list items', () => {});

		xit('should fetch the relationships of embedded list items', () => {});

		xit('should pass proper request options while fetching the relationships of embedded list items', () => {});

		xit('should save the embedded items to the local store if the items do not exist in the store already', () => {});

		xit('should save the embedded items to the local store if storePartialModels is set to true', () => {});

		it('should make a GET request with HTTP params', () => {
			const paramName1 = 'testParam';
			const paramValue1 = 'paramVal';

			const httpParams = new HttpParams().set(paramName1, paramValue1);
			datastoreService.find(MockModel, {}, true, [], { params: httpParams }).subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint`;
				expect(request.method).toEqual('GET');

				expect(request.params.get(paramName1)).toEqual(paramValue1);
				expect(request.params.keys().length).toEqual(1);

				return isCorrectUrl;
			});

			calls[0].flush(mockListWithEmbeddedJson);
		});

		it('should make a GET request with HTTP params when a paramater is passed in as an array', () => {
			const paramName1 = 'testParam';
			const paramValue1 = 'paramVal';

			const params: object = {
				[paramName1]: [paramValue1],
			};
			datastoreService.find(MockModel, params, true, []).subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint`;
				expect(request.method).toEqual('GET');

				expect(request.params.get(paramName1)).toEqual(paramValue1);
				expect(request.params.keys().length).toEqual(1);

				return isCorrectUrl;
			});

			calls[0].flush(mockListWithEmbeddedJson);
		});

		it('should make a GET request with HTTP params when a paramater is passed in as an array with multiple values', () => {
			const paramName1 = 'testParam';
			const paramValue1 = 'paramVal';
			const paramValue2 = 'paramVal2';
			const paramsArray = [paramValue1, paramValue2];

			const params: object = {
				[paramName1]: [paramValue1, paramValue2],
			};
			datastoreService.find(MockModel, params, true, []).subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint`;
				expect(request.method).toEqual('GET');

				expect(request.params.get(paramName1)).toEqual(paramsArray.join(','));
				expect(request.params.keys().length).toEqual(1);

				return isCorrectUrl;
			});

			calls[0].flush(mockListWithEmbeddedJson);
		});

		it('should make a GET request with HTTP params and params object', () => {
			const paramName1 = 'testParam';
			const paramValue1 = 'paramVal';

			const paramName2 = 'testParam2';
			const paramValue2 = 'paramVal2';

			const httpParams = new HttpParams().set(paramName1, paramValue1);
			datastoreService
				.find(MockModel, { [paramName2]: paramValue2 }, true, [], {
					params: httpParams,
				})
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean = request.url === `${BASE_NETWORK_URL}/mock-model-endpoint`;
				expect(request.method).toEqual('GET');

				expect(request.params.get(paramName1)).toEqual(paramValue1);
				expect(request.params.get(paramName2)).toEqual(paramValue2);
				expect(request.params.keys().length).toEqual(2);

				return isCorrectUrl;
			});

			calls[0].flush(mockListWithEmbeddedJson);
		});

		it('should make a GET request with templated query params passing in HTTP params and params object', () => {
			const paramName1 = 'testParam';
			const paramValue1 = 'paramVal';

			const paramName2 = 'testParam2';
			const paramValue2 = 'paramVal2';

			const templatedValue = 'tmpld';

			const httpParams = new HttpParams().set(paramName1, paramValue1).set('text', templatedValue);
			const params: object = {
				[paramName2]: paramValue2,
				text: templatedValue,
			};
			datastoreService
				.find(MockTemplatedModel, params, true, [], { params: httpParams })
				.subscribe();

			const calls: Array<TestRequest> = httpTestingController.match((request) => {
				const isCorrectUrl: boolean =
					request.url === `${BASE_NETWORK_URL}/mock-templated-model-endpoint`;
				expect(request.method).toEqual('GET');

				expect(request.params.get(paramName1)).toEqual(paramValue1);
				expect(request.params.get(paramName2)).toEqual(paramValue2);
				expect(request.params.get('text')).toEqual(templatedValue);
				expect(request.params.keys().length).toEqual(3);

				return isCorrectUrl;
			});

			calls[0].flush(mockListWithEmbeddedJson);
		});
	});

	describe('delete method', () => {
		it('should make a DELETE request', () => {
			const mockModel = new MockModel({}, datastoreService);

			mockModel.delete().subscribe();

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint`,
			);

			expect(req.request.method).toEqual('DELETE');

			req.flush(mockModelResponseJson);
		});

		it('should make a delete request to a custom URL if buildUrl function is provided', () => {
			const mockModel = new MockModel({}, datastoreService);

			const customUrl = 'fully-custom-rul';
			const customOptions: CustomOptions<MockModel> = {
				buildUrlFunction: () => {
					return customUrl;
				},
			};

			mockModel.delete({}, customOptions).subscribe();

			const req: TestRequest = httpTestingController.expectOne(customUrl);

			req.flush(mockModelResponseJson);
		});
	});

	describe('fetchModelRelationships method', () => {
		let mockModel: MockModel;

		beforeEach(async (done: DoneFn) => {
			datastoreService.findOne(MockModel, 'mockModelId').subscribe((mockModel1: MockModel) => {
				mockModel = mockModel1;
				done();
			});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);

			req.flush(mockModelResponseJson);
		});

		it('should fetch the relationship without fetching the original resource', () => {
			mockModel.fetchRelationships(['mockModel2Connection']).subscribe();

			const reqRelationship1: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock2/nup52clo`,
			);
			expect(reqRelationship1.request.method).toEqual('GET');

			httpTestingController.expectNone(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);

			reqRelationship1.flush(mockModel2ResponseJson);
		});

		it('should fetch the relationship with custom relationship name', () => {
			mockModel.fetchRelationships(['mockModel3Connection']).subscribe((mockModel: MockModel) => {
				expect(mockModel.mockModel3Connection).toBeTruthy();
				expect(mockModel.mockModel3Connection instanceof MockModel2).toBeTrue();
			});

			const reqRelationship1: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock2/nup52clo`,
			);
			expect(reqRelationship1.request.method).toEqual('GET');

			httpTestingController.expectNone(`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`);

			reqRelationship1.flush(mockModel2ResponseJson);
		});

		it('should fetch nested relationships', () => {
			mockModel.fetchRelationships(['mockModel2Connection.mockModel3s']).subscribe();

			const reqRelationship1: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock2/nup52clo`,
			);
			expect(reqRelationship1.request.method).toEqual('GET');
			reqRelationship1.flush(mockModel2ResponseJson);

			const nestedRelationship: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/Mock3`,
			);
			expect(nestedRelationship.request.method).toEqual('GET');

			nestedRelationship.flush({});
		});
	});

	describe('HAL Document', () => {
		it('should correctly extract list items if list property name is "item"', () => {
			const cars: HalDocument<CarModel> = datastoreService.createHalDocument(
				carsResponseJson as any,
				CarModel,
				{ body: carsResponseJson } as any,
			);

			expect(cars.models.length).toBe(3);
		});

		it('should correctly extract list items if list property name is not "item"', () => {
			const listItemPropertyName = 'testListItems';
			const modifiedCarsResponseJson = JSON.parse(
				JSON.stringify(carsResponseJson).replace(/item/g, listItemPropertyName),
			);

			const cars: HalDocument<CarModel> = datastoreService.createHalDocument(
				modifiedCarsResponseJson as any,
				CarModel,
				{ body: carsResponseJson } as any,
			);

			expect(cars.models.length).toBe(3);
		});

		it('should correctly extract list items if list property name is "list"', () => {
			const cars: HalDocument<CarModel> = datastoreService.createHalDocument(
				listItemsWithDifferentListNamesResponseJson as any,
				CarModel,
				{ body: carsResponseJson } as any,
			);

			expect(cars.models.length).toBe(3);
		});
	});

	// extractCurrentLevelRelationships is a private method but it has
	// some logic which I want to test separately from other behavior
	describe('extractCurrentLevelRelationships method', () => {
		const requestOptions1 = { params: { quantity: '1' } };
		const requestOptions2 = { params: { size: '100' } };

		const userRelationshipDescriptor: RelationshipRequestDescriptor = {
			name: 'user',
			options: requestOptions1,
		};
		const toysRelationshipDescriptor: RelationshipRequestDescriptor = {
			name: 'toys',
			options: requestOptions2,
		};
		const userAnimalsRelationshipDescriptor: RelationshipRequestDescriptor = {
			name: 'user.animals',
			options: requestOptions2,
		};

		it('should return an empty object if an empty array is passed in', () => {
			const result = datastoreService['extractCurrentLevelRelationships']([]);
			expect(result).toEqual({});
		});

		it('should return an array with one RelationshipRequestDescriptor without children if only top level relationship is passed', () => {
			const relationshipDescriptors: Array<RelationshipRequestDescriptor> = [
				userRelationshipDescriptor,
			];

			const result = datastoreService['extractCurrentLevelRelationships'](relationshipDescriptors);

			const expectedResult = {
				user: {
					originalRelationshipDescriptor: userRelationshipDescriptor,
					childrenRelationships: [],
				},
			};

			expect(result).toEqual(expectedResult);
		});

		it('should return an array with two RelationshipRequestDescriptor without children if two top level relationships are passed', () => {
			const relationshipDescriptors: Array<RelationshipRequestDescriptor> = [
				userRelationshipDescriptor,
				toysRelationshipDescriptor,
			];

			const result = datastoreService['extractCurrentLevelRelationships'](relationshipDescriptors);

			const expectedResult = {
				user: {
					originalRelationshipDescriptor: userRelationshipDescriptor,
					childrenRelationships: [],
				},
				toys: {
					originalRelationshipDescriptor: toysRelationshipDescriptor,
					childrenRelationships: [],
				},
			};

			expect(result).toEqual(expectedResult);
		});

		it('should return an array with one RelationshipRequestDescriptor with a single child', () => {
			const relationshipDescriptors: Array<RelationshipRequestDescriptor> = [
				userRelationshipDescriptor,
				userAnimalsRelationshipDescriptor,
			];

			const result = datastoreService['extractCurrentLevelRelationships'](relationshipDescriptors);

			const expectedResult = {
				user: {
					originalRelationshipDescriptor: userRelationshipDescriptor,
					childrenRelationships: [{ name: 'animals', options: requestOptions2 }],
				},
			};

			expect(result).toEqual(expectedResult);
		});

		// tslint:disable-next-line:max-line-length
		it('should return an array with one RelationshipRequestDescriptor with a single child but without originalRelationshipDescriptor', () => {
			const relationshipDescriptors: Array<RelationshipRequestDescriptor> = [
				userAnimalsRelationshipDescriptor,
			];

			const result = datastoreService['extractCurrentLevelRelationships'](relationshipDescriptors);

			const expectedResult = {
				user: {
					childrenRelationships: [{ name: 'animals', options: requestOptions2 }],
				},
			};

			expect(result).toEqual(expectedResult);
		});

		it('should group everything inside a single object property if all relationships share the same parent', () => {
			const relationshipDescriptors: Array<RelationshipRequestDescriptor> = [
				{ name: 'user.animals' },
				{ name: 'user.animals.toys' },
			];

			const result = datastoreService['extractCurrentLevelRelationships'](relationshipDescriptors);

			const expectedResult = {
				user: {
					childrenRelationships: [
						{ name: 'animals', options: undefined },
						{ name: 'animals.toys', options: undefined },
					],
				},
			};

			expect(result).toEqual(expectedResult);
		});
	});

	describe('LinkRelationship property', () => {
		it('should get URL from a link relationship', () => {
			datastoreService.findOne(MockModel, 'mockModelId').subscribe((model: MockModel) => {
				expect(model.getRelationshipUrl('simpleLinkRelationship')).toEqual(
					`${BASE_NETWORK_URL}/simpleLinkRelationship123`,
				);
			});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/mock-model-endpoint/mockModelId`,
			);

			req.flush(mockModelResponseJson);
		});
	});

	describe('externalName of model relationships', () => {
		it('should get a URL from a link relationship with a custom name', () => {
			datastoreService
				.findOne(MockModelWithCustomNames, 'jf7s90')
				.subscribe((model: MockModelWithCustomNames) => {
					expect(model.getRelationshipUrl('simpleLinkRelationship')).toEqual(
						`${BASE_NETWORK_URL}/simpleLinkRelationship123`,
					);

					expect(model.getRelationshipUrl('customNameOfSimpleLinkRelationship')).toBeUndefined();
				});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/external-names-mock-model-endpoint/jf7s90`,
			);

			req.flush(modelWithCustomNamesResponseJson);
		});

		it('should get a URL from a hasOne relationship with a custom name', () => {
			datastoreService
				.findOne(MockModelWithCustomNames, 'jf7s90')
				.subscribe((model: MockModelWithCustomNames) => {
					expect(model.getRelationshipUrl('mockModel2Connection')).toEqual(
						`${BASE_NETWORK_URL}/Mock2/nup52clo`,
					);

					expect(model.getRelationshipUrl('customNameOfMockModel2')).toBeUndefined();
				});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/external-names-mock-model-endpoint/jf7s90`,
			);

			req.flush(modelWithCustomNamesResponseJson);
		});

		it('should get a URL from a hasMany relationship with a custom name', () => {
			datastoreService
				.findOne(MockModelWithCustomNames, 'jf7s90')
				.subscribe((model: MockModelWithCustomNames) => {
					expect(model.getRelationshipUrl('someEmptyResources')).toEqual(
						`${BASE_NETWORK_URL}/Mock2?getSomeResources=true`,
					);

					expect(model.getRelationshipUrl('customNameOfSomeEmptyResources')).toBeUndefined();
				});

			const req: TestRequest = httpTestingController.expectOne(
				`${BASE_NETWORK_URL}/external-names-mock-model-endpoint/jf7s90`,
			);

			req.flush(modelWithCustomNamesResponseJson);
		});
	});
});
