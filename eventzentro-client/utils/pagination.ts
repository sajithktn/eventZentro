export const DEFAULT_PAGE_SIZE = 10;
export const SUMMARY_PAGE_SIZE = 100;

interface SearchParamsLike {
  get(name: string): string | null;
  toString(): string;
}

export type QueryParamValue =
  | string
  | number
  | null
  | undefined;

export const getPageFromSearchParams = (
  searchParams: SearchParamsLike
) => {
  const pageValue = Number(searchParams.get("page"));

  return Number.isInteger(pageValue) && pageValue > 0
    ? pageValue
    : 1;
};

export const createUrlWithQueryParams = (
  pathname: string,
  searchParams: SearchParamsLike,
  updates: Record<string, QueryParamValue>,
  resetPage = false
) => {
  const params = new URLSearchParams(searchParams.toString());

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      params.delete(key);
      return;
    }

    params.set(key, String(value));
  });

  if (resetPage) {
    params.set("page", "1");
  }

  const queryString = params.toString();

  return queryString ? `${pathname}?${queryString}` : pathname;
};

export type PaginationItem = number | "ellipsis";

export const getPaginationItems = (
  currentPage: number,
  totalPages: number
): PaginationItem[] => {
  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) => index + 1
    );
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  const normalizedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((firstPage, secondPage) => firstPage - secondPage);

  return normalizedPages.reduce<PaginationItem[]>(
    (items, page, index) => {
      const previousPage = normalizedPages[index - 1];

      if (previousPage && page - previousPage > 1) {
        items.push("ellipsis");
      }

      items.push(page);

      return items;
    },
    []
  );
};
