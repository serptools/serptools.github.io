import type { OperationType, MediaType } from './tools';

// Operation type definitions
export interface OperationDefinition {
  name: string;
  description: string;
  color: string;
}

// Media type definitions  
export interface MediaTypeDefinition {
  name: string;
  pluralName: string;
  description: string;
  color: string;
}

// Operation definitions map
export type OperationDefinitions = {
  [K in OperationType]: OperationDefinition;
};

// Media type definitions map
export type MediaTypeDefinitions = {
  [K in MediaType]: MediaTypeDefinition;
};