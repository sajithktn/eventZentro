"use client";

import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { PaginationMetadata } from "@/types/pagination";
import {
  createUrlWithQueryParams,
  getPaginationItems,
} from "@/utils/pagination";

interface PaginationProps {
  pagination: PaginationMetadata;
  resultLabel?: string;
  className?: string;
  scrollTargetId?: string;
}

export default function Pagination({
  pagination,
  resultLabel = "results",
  className = "",
  scrollTargetId,
}: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const {
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    hasNextPage,
    hasPreviousPage,
  } = pagination;

  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const normalizedCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const firstResult =
    (normalizedCurrentPage - 1) * pageSize + 1;

  const lastResult = Math.min(
    normalizedCurrentPage * pageSize,
    totalItems
  );

  const scrollToResults = () => {
    window.setTimeout(() => {
      const target = scrollTargetId
        ? document.getElementById(scrollTargetId)
        : null;

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });

        return;
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 0);
  };

  const goToPage = (page: number) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === normalizedCurrentPage
    ) {
      return;
    }

    const url = createUrlWithQueryParams(
      pathname,
      searchParams,
      { page },
      false
    );

    router.push(url, {
      scroll: false,
    });

    scrollToResults();
  };

  const baseButtonClasses =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition";

  const inactiveButtonClasses =
    "border-orange-100 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600";

  const activeButtonClasses =
    "border-slate-900 bg-slate-900 text-white shadow-sm";

  const disabledButtonClasses =
    "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300";

  return (
    <nav
      className={`flex flex-col items-center justify-center gap-4 rounded-[22px] border border-orange-100 bg-white px-4 py-4 shadow-sm ${className}`}
      aria-label="Pagination"
    >
      <p className="text-center text-sm font-semibold text-slate-500">
        Showing {firstResult}-{lastResult} of{" "}
        {totalItems} {resultLabel}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() =>
            goToPage(
              normalizedCurrentPage - 1
            )
          }
          disabled={!hasPreviousPage}
          className={`${baseButtonClasses} ${
            hasPreviousPage
              ? inactiveButtonClasses
              : disabledButtonClasses
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft size={17} />

          <span className="hidden sm:inline">
            Previous
          </span>
        </button>

        <div className="hidden items-center justify-center gap-2 sm:flex">
          {getPaginationItems(
            normalizedCurrentPage,
            totalPages
          ).map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                className="inline-flex h-10 min-w-10 items-center justify-center text-slate-400"
              >
                <MoreHorizontal size={18} />
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() =>
                  goToPage(item)
                }
                aria-current={
                  item ===
                  normalizedCurrentPage
                    ? "page"
                    : undefined
                }
                className={`${baseButtonClasses} ${
                  item ===
                  normalizedCurrentPage
                    ? activeButtonClasses
                    : inactiveButtonClasses
                }`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <span className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-600 sm:hidden">
          {normalizedCurrentPage} /{" "}
          {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            goToPage(
              normalizedCurrentPage + 1
            )
          }
          disabled={!hasNextPage}
          className={`${baseButtonClasses} ${
            hasNextPage
              ? inactiveButtonClasses
              : disabledButtonClasses
          }`}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">
            Next
          </span>

          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}