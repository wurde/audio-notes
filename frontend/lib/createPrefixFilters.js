function addZero(i) {
  if (i < 10) { i = "0" + i }
  return i;
}

export default function createPrefixFilters() {
  const date = new Date();

  const year = addZero(date.getFullYear());
  const month = addZero(date.getMonth() + 1);
  const lastMonth = addZero(date.getMonth());
  const prevLastMonth = addZero(date.getMonth() - 1);

  return [`${year}${month}`, `${year}${lastMonth}`, `${year}${prevLastMonth}`];
}
