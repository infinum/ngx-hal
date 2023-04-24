import { ModelProperty } from '../../interfaces/model-property.interface';

// export function getMetadata<T extends ModelProperty>(obj: Record<string, any>, metaKey: string): Array<T> {
//   if (!Object.prototype.hasOwnProperty.call(obj, metaKey)) {
//     Object.defineProperty(obj, metaKey, {
//       configurable: false,
//       enumerable: false,
//       value: []
//     });
//   }

//   return obj[metaKey];
// }

export function getObjProperty(obj, propertyKey: string, defaultValue: any = []) {
	const objClass = getClass(obj);

	if (!Object.prototype.hasOwnProperty.call(objClass, propertyKey)) {
		setObjProperty(objClass, propertyKey, defaultValue);
	}

	const x = objClass[propertyKey];
	return x;
}

export function setObjProperty(objClass, propertyKey, value) {
	Object.defineProperty(objClass, propertyKey, {
		configurable: true,
		enumerable: false,
		value,
	});
}

// returns a new array, therefore, pushing into it won't affect the class metadata
export function getArrayObjProperty<T>(obj, propertyKey: string): Array<T> {
	const objClass = getClass(obj);
	const parentClass = Object.getPrototypeOf(objClass);
	const isTopLevelClass = parentClass === Object.getPrototypeOf(Function);

	let parentMeta: Array<T> = [];

	if (!isTopLevelClass) {
		parentMeta = getArrayObjProperty(parentClass, propertyKey);
	}
	const meta: Array<T> = getObjProperty(obj, propertyKey);
	const finalMeta = [].concat(parentMeta, meta);

	return finalMeta;
}

function getClass<T>(obj: T): T {
	return (typeof obj === 'function' ? obj : obj.constructor) as unknown as T;
}
