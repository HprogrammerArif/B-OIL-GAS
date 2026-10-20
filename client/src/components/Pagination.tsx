import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Lang, t } from '../types';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  lang?: Lang;
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  lang = 'en',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null; // No need for pagination if items fit on 1 page

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="enterprise-pagination" aria-label="Pagination Navigation">
      <div className="pagination-info">
        {lang === 'en' ? (
          <>
            Showing <strong>{startIdx}–{endIdx}</strong> of <strong>{totalItems}</strong>
          </>
        ) : (
          <>
            মোট <strong>{totalItems}</strong> টির মধ্যে <strong>{startIdx}–{endIdx}</strong> প্রদর্শন
          </>
        )}
      </div>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
          <span>{t('Prev', 'পূর্ববর্তী', lang)}</span>
        </button>

        <div className="pagination-pages">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              type="button"
              className={`pagination-page-pill ${pageNum === currentPage ? 'active' : ''}`}
              onClick={() => onPageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="pagination-btn nav-btn"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next Page"
        >
          <span>{t('Next', 'পরবর্তী', lang)}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
