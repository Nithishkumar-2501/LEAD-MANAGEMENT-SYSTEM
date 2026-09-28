import { useMemo } from 'react'

export interface UsePaginationProps {
  currentPage: number
  totalPages: number
  paginationItemsToDisplay?: number
}

export interface UsePaginationReturn {
  pages: number[]
  showLeftEllipsis: boolean
  showRightEllipsis: boolean
}

export function usePagination({
  currentPage,
  totalPages,
  paginationItemsToDisplay = 5,
}: UsePaginationProps): UsePaginationReturn {
  return useMemo(() => {
    if (totalPages <= 0) {
      return { pages: [], showLeftEllipsis: false, showRightEllipsis: false }
    }

    if (totalPages <= paginationItemsToDisplay) {
      const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
      return { pages, showLeftEllipsis: false, showRightEllipsis: false }
    }

    const half = Math.floor(paginationItemsToDisplay / 2)
    let start = Math.max(1, currentPage - half)
    let end = start + paginationItemsToDisplay - 1

    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - paginationItemsToDisplay + 1)
    }

    const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)
    const showLeftEllipsis = start > 1
    const showRightEllipsis = end < totalPages

    return {
      pages,
      showLeftEllipsis,
      showRightEllipsis,
    }
  }, [currentPage, totalPages, paginationItemsToDisplay])
}
