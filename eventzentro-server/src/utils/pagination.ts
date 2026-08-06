import {
  PaginationMetadata,
  PaginationQueryParams,
} from "../interfaces/pagination.interface";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 100;

export interface ParsedPaginationQuery
  extends Required<
    Pick<PaginationQueryParams, "page" | "limit">
  > {
  skip: number;
  search?: string;
  category?: string;
  status?: string;
  sort?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  dateFrom?: string;
  dateTo?: string;
  organizer?: string;
}

type QueryInput = {
  [key: string]: unknown;
};

const getQueryString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const trimmedValue = value.trim();

    return trimmedValue || undefined;
  }

  if (Array.isArray(value)) {
    const firstStringValue = value.find(
      (item): item is string => typeof item === "string"
    );

    return firstStringValue?.trim() || undefined;
  }

  return undefined;
};

const parsePositiveInteger = (
  value: string | undefined,
  fallback: number
) => {
  if (!value) {
    return fallback;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  const integerValue = Math.floor(numericValue);

  return integerValue > 0 ? integerValue : fallback;
};

const parseNonNegativeNumber = (
  value: string | undefined
) => {
  if (!value) {
    return undefined;
  }

  const numericValue = Number(value);

  if (
    !Number.isFinite(numericValue) ||
    numericValue < 0
  ) {
    return undefined;
  }

  return numericValue;
};

export const parsePaginationQuery = (
  query: QueryInput
): ParsedPaginationQuery => {
  const page = parsePositiveInteger(
    getQueryString(query.page),
    DEFAULT_PAGE
  );

  const requestedLimit = parsePositiveInteger(
    getQueryString(query.limit),
    DEFAULT_LIMIT
  );

  const limit = Math.min(requestedLimit, MAX_LIMIT);
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
    search: getQueryString(query.search),
    category: getQueryString(query.category),
    status: getQueryString(query.status),
    sort: getQueryString(query.sort),
    location: getQueryString(query.location),
    minPrice: parseNonNegativeNumber(
      getQueryString(query.minPrice)
    ),
    maxPrice: parseNonNegativeNumber(
      getQueryString(query.maxPrice)
    ),
    dateFrom: getQueryString(query.dateFrom),
    dateTo: getQueryString(query.dateTo),
    organizer: getQueryString(query.organizer),
  };
};

export const buildPaginationMetadata = (
  currentPage: number,
  pageSize: number,
  totalItems: number
): PaginationMetadata => {
  const totalPages = Math.ceil(totalItems / pageSize);

  return {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
  };
};

export const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
