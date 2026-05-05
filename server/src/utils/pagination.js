export function getPagination(query) {
  const page = Math.max(Number.parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit || "12", 10), 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages: Math.max(Math.ceil(total / limit), 1)
  };
}
