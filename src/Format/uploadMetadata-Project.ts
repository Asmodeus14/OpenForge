export interface ProjectImage {
  cid: string;
  type: "cover" | "gallery";
}

export interface ProjectMetadata {
  type: "project";
  version: "1.0";

  title: string;
  description: string;
  tags: string[];

  images?: ProjectImage[];

  createdAt: number;
  updatedAt?: number;
}
