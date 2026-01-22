export interface PaginatedResponse<T> {
  totalItems: number;
  items: T[];
  totalPages: number;
  currentPage: number;
}