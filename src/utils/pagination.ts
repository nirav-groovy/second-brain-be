export interface Pagination {
  totalCount: number;
  pageSize: number;
  totalPage: number;
  currentPage: number;
  isMore: boolean;
}

export const getPaginationMetadata = async (
  totalCount: number,
  currentPage: number,
  pageSize: number
): Promise<Pagination> => {
  // Calculate the total number of pages based on the total count and page size.
  let totalPage = Math.ceil(totalCount / pageSize);

  // Check if there are more pages after the current page.
  let isMore = !(totalPage <= currentPage || totalPage === 0);

  let pagination: Pagination = {
    totalCount: totalCount, // Total number of items.
    pageSize: pageSize, // Number of items per page.
    totalPage: totalPage, // Total number of pages.
    currentPage: currentPage, // Current page number.
    isMore: isMore, // Flag indicating if there are more pages after the current page.
  };
  return pagination;
};
