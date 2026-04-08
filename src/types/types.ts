
export type ModuleType = {
  id: string;
  name: string;
  domain: string;
  features: FeatureType[];
  riskLevel: string;
  documentationStatus: string;
  description: string;
  pmOwner: string;
  techOwner: string;
  criticality: string;
};

export type FeatureType = {
  id: string;
  name: string;
  moduleId: string;
  module: ModuleType;
  businessGoal: string;
  actors: string;
  screens: string;
  components: string;
  services: string;
  endpoints: string;
  entities: string;
  businessRules: string;
  dependencies: string;
  technicalComplexity: string;
  businessComplexity: string;
  riskLevel: string;
  busFactor: number;
  pmOwner: string;
  techOwner: string;
  techDebt: string;
  documentationStatus: string;
};

export type FlowType = {
  id: string;
  featureId: string;
  feature: FeatureType;
  steps: FlowStepType[];
};

export type FlowStepType = {
  id: string;
  flowId: string;
  order: number;
  actor: string;
  screen: string;
  action: string;
  service: string;
  endpoint: string;
  output: string;
  flow: FlowType;
};

export type RelationType = {
  id: string;
  fromType: string;
  fromId: string;
  relationType: string;
  toType: string;
  toId: string;
  metadata: string;
};

export type EdgeType = {
  id: string;
  source: string;
  target: string;
};