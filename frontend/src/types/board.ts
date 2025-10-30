export interface Board {
  _id: string;
  title: string;
  description?: string;
  owner?: string | { _id?: string; displayName?: string; username?: string; avatarUrl?: string };
  members?: Array<string | { _id?: string; displayName?: string; username?: string; avatarUrl?: string }>;
  workspace?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ListItem {
  _id: string;
  title: string;
  boardId: string;
  position: number;
}

export interface CardItem {
  _id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
}
