function getSwipePageDelta(start, end, options = {}) {
  const threshold = Number(options.threshold || 45);
  const axisRatio = Number(options.axisRatio || 1.4);
  const deltaX = Number(end && end.x) - Number(start && start.x);
  const deltaY = Number(end && end.y) - Number(start && start.y);

  if (![deltaX, deltaY].every(Number.isFinite)) return 0;
  if (Math.abs(deltaX) < threshold) return 0;
  if (Math.abs(deltaX) < Math.abs(deltaY) * axisRatio) return 0;
  return deltaX < 0 ? 1 : -1;
}

function getNextPageNumber(currentPage, delta, options = {}) {
  const min = Number.isFinite(Number(options.min)) ? Number(options.min) : 1;
  const rawMax = Number(options.max);
  const max = Number.isFinite(rawMax) && rawMax > 0 ? rawMax : Infinity;
  const current = Number(currentPage) || min;
  const next = current + (Number(delta) || 0);
  return Math.max(min, Math.min(max, next));
}

function selectReaderPage(pages, requestedPage) {
  if (!Array.isArray(pages) || pages.length === 0) return null;
  const target = Number(requestedPage) || 1;
  const sortedPages = [...pages].sort((left, right) => (Number(left.c_page) || 0) - (Number(right.c_page) || 0));
  return (
    sortedPages.find((page) => Number(page.c_page) === target) ||
    sortedPages.find((page) => Number(page.c_page) > target) ||
    sortedPages[sortedPages.length - 1]
  );
}

module.exports = {
  getSwipePageDelta,
  getNextPageNumber,
  selectReaderPage,
};
