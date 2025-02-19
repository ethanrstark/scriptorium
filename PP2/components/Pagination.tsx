import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {

  if (currentPage > totalPages || currentPage < 1) {
    onPageChange(1);
  }

  return (
    <div className="flex items-center space-x-4 mt-6">
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`px-4 py-2 border rounded ${currentPage === 1 ? "cursor-not-allowed text-gray-500" : "hover:bg-gray-600"}`}
      >
        Previous
      </button>

      <p> page {currentPage} of {totalPages}</p>

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 border rounded ${currentPage === totalPages ? "cursor-not-allowed text-gray-500" : "hover:bg-gray-600"}`}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

// TODO handle errors if page is out of bounds