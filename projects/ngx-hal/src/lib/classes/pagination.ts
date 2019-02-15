export class Pagination {
  constructor(private rawPagination: any = {}) {}

  public get currentPage(): number {
    return this.rawPagination.number;
  }

  public get pageSize(): number {
    return this.rawPagination.size;
  }

  public get totalItems(): number {
    return this.rawPagination.totalElements;
  }

  public get totalPages(): number {
    return this.rawPagination.totalPages;
  }
}
