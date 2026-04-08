// Tipos compartidos del catálogo de entidades.
// Usados tanto en la API /api/entities como en los componentes cliente
// (FlowSwimlane, FeatureDetailPanel) para mostrar opciones y resolver IDs.

export type CatalogScreen = {
  id:         string;
  name:       string;
  route:      string | null;
  moduleId:   string;
  moduleName: string;
};

export type CatalogComponent = {
  id:      string;
  name:    string;
  type:    string;
  purpose: string;
};

export type CatalogService = {
  id:       string;
  name:     string;
  purpose:  string;
  moduleId: string | null;
};

export type CatalogEndpoint = {
  id:               string;
  method:           string;
  path:             string;
  purpose:          string;
  requestEntities:  string;   // JSON array string[]
  responseEntities: string;   // JSON array string[]
};

export type EntityCatalog = {
  screens:    CatalogScreen[];
  components: CatalogComponent[];
  services:   CatalogService[];
  endpoints:  CatalogEndpoint[];
};
