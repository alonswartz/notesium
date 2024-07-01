#!/usr/bin/env node

function getISOWeekNum(date) {
  const tempDate = new Date(date.getTime());
  tempDate.setHours(0, 0, 0, 0);
  tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
  const week1 = new Date(tempDate.getFullYear(), 0, 4);
  return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getSunWeekNum(date) {
  const sunday = new Date(date);
  sunday.setDate(date.getDate() - date.getDay());
  const firstSunday = new Date(sunday.getFullYear(), 0, 1);
  if (firstSunday.getDay() !== 0) firstSunday.setMonth(0, 1 + (7 - firstSunday.getDay()) % 7);
  return 1 + Math.floor((sunday - firstSunday) / 604800000);
}

function formatDate(date, format) {
  const padZero = (num) => { return num.toString().padStart(2, '0'); }
  const replacements = {
    '%Y': date.getFullYear(),
    '%m': padZero(date.getMonth() + 1),
    '%d': padZero(date.getDate()),
    '%H': padZero(date.getHours()),
    '%M': padZero(date.getMinutes()),
    '%S': padZero(date.getSeconds()),
    '%a': date.toLocaleString('en-US', { weekday: 'short' }),
    '%b': date.toLocaleString('en-US', { month: 'short' }),
    '%u': date.getDay() === 0 ? 7 : date.getDay(),
    '%U': padZero(getSunWeekNum(date)),
    '%V': padZero(getISOWeekNum(date)),
  };
  return format.replace(/%[a-zA-Z]/g, match => replacements[match]);
}

function weeklyTest(customDate = null) {
  const date = customDate ? new Date(customDate) : new Date();
  const epoch = date.getTime() / 1000;
  const day = date.getDay() === 0 ? 7 : date.getDay();

  const diff = (day - startOfWeek + 7) % 7;
  const weekBegEpoch = epoch - (diff * 86400);
  const weekBegDate = new Date(weekBegEpoch * 1000);
  const weekBegStr = formatDate(weekBegDate, '%a %b %d');
  const weekEndEpoch = weekBegEpoch + (6 * 86400);
  const weekEndDate = new Date(weekEndEpoch * 1000);
  const weekEndStr = formatDate(weekEndDate, '%a %b %d');

  const year = formatDate(weekBegDate, '%Y');
  const weekFmt = startOfWeek === 0 ? '%U' : '%V';
  const weekNum = formatDate(weekBegDate, weekFmt);

  const cdate = formatDate(weekBegDate, '%Y-%m-%d');
  const title = `# ${year}: Week${weekNum} (${weekBegStr} - ${weekEndStr})`;
  const dateInput = `${customDate}:${startOfWeek}`;

  console.log(`${dateInput} ${cdate} ${title}`);
}


let startOfWeek = null;
const args = process.argv.slice(2);
args.forEach(arg => {
  const [date, weekstart] = arg.split(':');
  startOfWeek = parseInt(weekstart);
  weeklyTest(date);
});

