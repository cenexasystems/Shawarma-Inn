export function getDateRangeSql(reqQuery, dateField = 'created_at') {
  const range = String(reqQuery.range || reqQuery.dateRange || '').trim();
  const customFrom = String(reqQuery.customFrom || reqQuery.dateFrom || '').trim();
  const customTo = String(reqQuery.customTo || reqQuery.dateTo || '').trim();

  const now = new Date();
  let from = null;
  let to = null;

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (range === 'custom' && customFrom && customTo) {
    from = customFrom;
    to = customTo;
  } else if (range === 'today') {
    from = fmt(now);
    to = fmt(now);
  } else if (range === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    from = fmt(yesterday);
    to = fmt(yesterday);
  } else if (range === '7days') {
    const past = new Date(now);
    past.setDate(now.getDate() - 6);
    from = fmt(past);
    to = fmt(now);
  } else if (range === '30days') {
    const past = new Date(now);
    past.setDate(now.getDate() - 29);
    from = fmt(past);
    to = fmt(now);
  } else if (range === 'this_month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    from = fmt(startOfMonth);
    to = fmt(now);
  } else if (range === 'last_month') {
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    from = fmt(startOfLastMonth);
    to = fmt(endOfLastMonth);
  } else if (range === 'this_year') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    from = fmt(startOfYear);
    to = fmt(now);
  } else if (customFrom && customTo) {
    from = customFrom;
    to = customTo;
  }

  const where = [];
  const params = [];

  if (from) {
    where.push(`date(${dateField}, 'localtime') >= date(?)`);
    params.push(from);
  }
  if (to) {
    where.push(`date(${dateField}, 'localtime') <= date(?)`);
    params.push(to);
  }

  return {
    sqlClause: where.length > 0 ? where.join(' AND ') : '1=1',
    params,
    from,
    to
  };
}
