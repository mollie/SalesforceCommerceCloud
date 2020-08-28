var Calendar = require('dw/util/Calendar');
var formatCalendar = require('dw/util/StringUtils').formatCalendar;

const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSSXXX";

exports.ISO_FORMAT = ISO_FORMAT;

/**
 *
 * @function
 * @description Parses an ISO 8601 DateString to a Calendar Object
 * @param {string} isoString - ISO8601 Date
 * @returns {dw.util.Calendar} - Calendar object
 */
exports.parseISOString = function (isoString) {
    try {
        var cal = new Calendar();
        cal.parseByFormat(isoString, ISO_FORMAT);
        return cal;
    } catch (e) {
        return null;
    }
};

/**
 *
 * @function
 * @description Parses a calendar object to an ISO 8601 DateString
 * @param {dw.util.Calendar} calendar - Calendar object
 * @returns {string} isoString - ISO8601 Date
 */
exports.toISOString = function (calendar) {
    var date = calendar.getTime();
    return date.toISOString();
};

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

exports.format = function (calendar, format) {
    return formatCalendar(calendar, format);
}