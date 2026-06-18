export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number | null;
  limit: number | null;
  totalPages: number | null;
}