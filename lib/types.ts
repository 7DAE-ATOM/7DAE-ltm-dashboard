export type LabTestMeanType = "SIB" | "SIMU" | "FIB" | "RT" | "SHARE" | "NA";

export type LabTestMeanStatus =
  | "operational"
  | "mothballed"
  | "out-of-service"
  | "in-project";

export type Complexity = "simple" | "medium" | "complex";

/** Tri-state photo filter: any LTM / only with ≥1 photo / only without photos. */
export type PhotoFilter = "all" | "with" | "without";

/** Tri-state quality seal filter: any LTM / only DRAFT / only RELEASE. */
export type QualitySealFilter = "all" | "draft" | "released";

export type TechnicalCapability =
  | "aircraft-simulation-package"
  | "automatic-testing"
  | "remote-access"
  | "no-remote-access";

/**
 * A photo attached to a lab test mean.
 *
 * - `resourceId` / `resourceUri` are passed directly to the ATOM backend
 *   `POST /api/infos/resource` from the browser (CORS enabled).
 * - `kind` reflects the `SELECTED` naming convention from the backend.
 * - `is360` is true when the document name ends with `3D.<ext>` — equirectangular panoramas.
 */
export type Photo = {
  resourceId: string;
  resourceUri: string;
  alt?: string;
  kind?: "selected" | "other";
  is360?: boolean;
};

export type CoverPhoto = { id: string; uri: string };

export type Location = {
  country: string;
  city: string;
  site: string;
  building: string;
  room?: string;
  lat?: number;
  lng?: number;
};

export type Person = {
  name: string;
  email: string;
};

export type Security = {
  ecLevel: string | null;
  networkSegregated: boolean | null;
  accesscontrol: boolean | null;
  accesbadge: string | null;
  accreditation: string[];
};

export type Roles = {
  architects?: Person[];
  projectManagers?: Person[];
  workPakageLeaders?: Person[];
  leadEngineers?: Person[];
  deputies?: Person[];
  depts?: Person[];
};

export type Lifecycle = {
  kickoff?: string;
  inService?: string;
  mothballed?: string;
  dismantled?: string;
};

export type DependencyRelationKind =
  | "depends-on"
  | "supports"
  | "shared-resource";

export type DependencyRelation = {
  id: string;
  externalId: string;
  name: string;
  kind: DependencyRelationKind;
  // Absent means "not determined" — never an empty string or any value
  // other than these two.
  dependencyType?: "mandatory" | "optional";
};

export type AircraftStructureCategory =
  | "programFamily"
  | "aircraftType"
  | "aircraftSeries"
  | "aircraftModel"
  | "aircraftProject";

export type AircraftStructureNode = {
  id: string;
  name: string;
  category: AircraftStructureCategory;
  code: string;
  parentId?: string;
  parentName?: string;
  children?: AircraftStructureNode[];
};

export type LabTestMean = {
  id: string;
  externalId: string;
  /** Business identifier of the bench; null when absent, empty or blank. */
  functionalCode: string | null;
  name: string;
  type: LabTestMeanType;
  complexity: Complexity | null;
  description: string;
  instrumentation: string | null;
  status: LabTestMeanStatus;
  location: Location;
  manager: Person | null;
  roles: Roles;
  security: Security;
  lifecycle: Lifecycle;
  programs: string[];
  atas: string[];
  softwares: { id: string; name: string }[];
  dependsOn: DependencyRelation[];
  supports: DependencyRelation[];
  sharedResources: DependencyRelation[];
  portfolio: { id: string; name: string } | null;
  technicalCapabilities: TechnicalCapability[];
  projects: string[];
  coverPhoto: CoverPhoto | null;
  photos: Photo[];
  lxState: "DRAFT" | "RELEASE";
};
