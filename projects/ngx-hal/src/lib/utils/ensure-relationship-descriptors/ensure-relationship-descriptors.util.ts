import { RelationshipRequestDescriptor } from '../../types/relationship-request-descriptor.type';

export function ensureRelationshipRequestDescriptors(
	relationships: Array<string | RelationshipRequestDescriptor>,
): Array<RelationshipRequestDescriptor> {
	return relationships.map((relationshipDescriptor: string | RelationshipRequestDescriptor) => {
		if (typeof relationshipDescriptor === 'string') {
			return { name: relationshipDescriptor };
		}

		return relationshipDescriptor;
	});
}
