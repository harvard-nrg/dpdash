const stringToDate = (_date, _format, _delimiter) => {
  let formatLowerCase = _format.toLowerCase();
  let formatItems = formatLowerCase.split(_delimiter);
  let dateItems = _date.split(_delimiter);
  let monthIndex = formatItems.indexOf("mm");
  let dayIndex = formatItems.indexOf("dd");
  let yearIndex = formatItems.indexOf("yyyy");
  let month = parseInt(dateItems[monthIndex]);
  let year = (dateItems[yearIndex].length == 2 ? '20' + dateItems[yearIndex] : dateItems[yearIndex]);
  return new Date(year, --month, dateItems[dayIndex]);
}
const diffDates = (date1, date2) => {
  let millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round((date2 - date1) / millisecondsPerDay);
}

export { diffDates, stringToDate };