var Calendar = require('dw/util/Calendar');
var formatCalendar = require('dw/util/StringUtils').formatCalendar;

/**
 *
 * @function
 * @description Adds days to a calendar object
 * @param {dw.util.Calendar} calendar - Calendar object
 * @param {number} numDays - Number of days to add
 * @returns {dw.util.Calendar} updated calendar object
 */
exports.addDays = function (calendar, numDays) {
    calendar.add(Calendar.DATE, numDays || 0);
    return calendar;
};

/**
 *
 * @function
 * @description Adds hours to a calendar object
 * @param {dw.util.Calendar} calendar - Calendar object
 * @param {number} numHours - Number of hours to add
 * @returns {dw.util.Calendar} updated calendar object
 */
exports.addHours = function (calendar, numHours) {
    calendar.add(Calendar.HOUR, numHours || 0);
    return calendar;
};

/**
 *
 * @function
 * @description Adds a new calendar object set to current date
 * @returns {dw.util.Calendar} updated calendar object
 */
exports.now = function () {
    return new Calendar();
};

/**
 *
 * @function
 * @description Formats calendar date
 * @param {dw.util.Calendar} calendar - Calendar object
 * @param {string} format - format
 * @returns {dw.util.Calendar} updated calendar object
 */
exports.format = function (calendar, format) {
    return formatCalendar(calendar, format);
}