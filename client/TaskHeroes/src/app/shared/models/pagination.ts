import {Message} from './message';

export interface PaginatedResponse<T> {
  totalItems: number;
  items: T[];
  totalPages: number;
  currentPage: number;
}

export interface PaginatedMessages {
  items: Message[];
  totalItems: number;
  nextCursor: string | number | null;
}