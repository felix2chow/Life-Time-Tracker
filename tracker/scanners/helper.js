/**
 * scanner helper
 * read single file or multiple files
 */
'use strict';

var dateTypeEnum = require('../enum/dateType');
var util = require('../util');
var when = require('when');
var msg = require('../message');


function readLogFile(options) {
    var dateType = options.dateType,
        dateArr = options.dateArr,
        year = dateArr[0],
        month = dateArr[1],
        day = dateArr[2];

    var promise;
    if (dateType === dateTypeEnum.Day) {
        promise = readOneDayLog(year, month, day);
    } else if (dateType === dateTypeEnum.Month){
        promise = readOneMonthLog(year, month);
    }

    return promise.then(preprocessFileData.bind(null, options));
}


/**
 * read only the log of one specific day
 */
function readOneDayLog(year, month, day) {
    return util.readLogFiles([year, month, day].join('-'));
}


/**
 * read only the log of one specific month
 *
 */
function readOneMonthLog(year, month) {
    //the day number of month
    var dayNum = util.getDayNumInMonth(year, month);
    var day = 1;
    var queue = [];
    while (day <= dayNum) {
        queue.push(readOneDayLog(year, month, day));
        day++;
    }
    //use when.settle: because some file may not exist
    //so when.all is not appropriate
    return when.settle(queue);
}

function preprocessFileData(options, fileData) {
    var dateStr = options.dateStr;
    if (options.dateType === dateTypeEnum.Month) {
        fileData = fileData.filter(function (d, index) {
            var day = index + 1,
                date = [dateStr, day].join('-');
            if (d.state === 'rejected') {
                msg.warn(date + ' calculate fail');
                return false;
            } else if (d.state === 'fulfilled'){
                return true;
            }
        }).map(function (d) {
            return d.value;
        });
    }
    return fileData;
}

exports.readLogFile = readLogFile;
exports.readOneDayLog = readOneDayLog;
exports.readOneMonthLog = readOneMonthLog;
