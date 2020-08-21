
/**
 *  Merge a number of objects
 */
function mergeObjects() {
    var res = {};
    for (var i = 0; i < arguments.length; i++) {
        arguments[i].forEach(function () {
            res[x] = arguments[i][x];
        });
    }
    return res;
}

function getProperty(object, value) {
    for (var currentValue in object) {
        if (object.hasOwnProperty(currentValue)) {
            if (object[currentValue] === value) {
                return currentValue;
            }
        } else {
            return null;
        }
    }
}

exports.mergeObjects = mergeObjects;
exports.getProperty = getProperty;
