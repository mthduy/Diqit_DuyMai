export interface Workspace {
  _id: string;
  name: string;
  owner?: string;
  members?: string[];
  createdAt?: string;
  updatedAt?: string;
}
