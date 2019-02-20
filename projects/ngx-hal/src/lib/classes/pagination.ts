import { RawHalResource } from '../interfaces/raw-hal-resource.interface';

export class Pagination {
  private rawPagination: any;

  constructor(rawResource: RawHalResource = {}) {
    this.rawPagination = rawResource.page;
  }

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
