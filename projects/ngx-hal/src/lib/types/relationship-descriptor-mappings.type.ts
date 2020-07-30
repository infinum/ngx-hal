import { RelationshipRequestDescriptor } from './relationship-request-descriptor.type';

export type RelationshipDescriptorMappings = {
  [key: string]: {
    originalRelationshipDescriptor?: RelationshipRequestDescriptor;
    childrenRelationships: Array<RelationshipRequestDescriptor>;
  };
};
