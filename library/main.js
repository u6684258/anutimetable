var app          = angular.module('anutimetable', []);
var revision_num = 1;

app.controller('main', ['$scope', function ($scope) {
    $scope.days          = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    $scope.current_day   = 0;
    $scope.courses_db    = {};
    $scope.error_display = false;
    $scope.error_message = '';

    var compress_struct = {
        'course': ['name', 'classes'],
        'class': ['start', 'duration', 'day', 'loc_id']
    };

    // create course database
    $.getJSON('./data/timetable.json?VERSION=' + revision_num, {}, function (data) {
        // parse JSON fields into human readable key names
        var id;
        for (var course_code in data[0]) {
            // decompress course structure
            var course = data[0][course_code], db;

            // no classes found, skip
            if (!Tool.sizeOf(course[compress_struct.course.indexOf('classes')])) continue;

            $scope.courses_db[course_code] = db = {};
            for (id in course) {
                db[compress_struct.course[id]] = course[id];
            }

            // decompress class structure
            var classes = {};
            for (var class_name in db.classes) {
                classes[class_name] = {};
                for (var i in db.classes[class_name]) {
                    classes[class_name][i] = [];
                    for (id in db.classes[class_name][i]) {
                        classes[class_name][i][compress_struct.class[id]] = db.classes[class_name][i][id];
                    }
                }
            }
            db.classes = classes;

        }
        $scope.$apply();
    }).fail(function () {
        Tool.printError('Failed loading the JSON file, please refresh the page and try again.', $scope);
        $scope.$apply();
    });


    $scope.getLocation = function (loc_id) {
        return {
            name: $scope.locations[loc_id][0],
            link: 'http://www.anu.edu.au/maps#show=' + $scope.locations[loc_id][1]
        };
    };

    $scope.timeRange = function (from, to) {
        var result = [];
        for (var i = parseFloat(from); i < to; i += 0.5) {
            var hour = parseInt(i);
            var hour_padded = Tool.pad(hour, 2, 0);
            result.push(
                hour_padded + ':' + Tool.pad((i - hour) * 60, 2, 0) + '-' +
                hour_padded + ':' + (hour == i ? '29' : '59')
            );
        }
        console.log(result);
        return result;
    };

    $('#course-name').typeahead({
        highlight: true,
        hint: false
    }, {
        limit: 10,
        source: function (query, process) {
            var match_indexes = [], matches = [];

            // Building the array matchIndexes which stores query's appearance position
            // in the course name, also fills the array matches for temporary ease of use.
            query = query.trim().toLowerCase();
            $.each($scope.courses_db, function (course_code, course) {
                var full_text   = course_code + course.name,
                    match_index = full_text.toLowerCase().indexOf(query);
                if (match_index !== -1 && matches.indexOf(course.name) === -1) {
                    match_indexes.push({
                        code: course_code,
                        name: course.name,
                        index: match_index
                    });
                    matches.push(course.name);
                }
            });

            // Sort them depends on the appeared position and name in ascending order
            match_indexes.sort(function (a, b) {
                return a.index - b.index + a.name.localeCompare(b.name);
            });

            // Build the final result.
            matches = [];
            $.each(match_indexes, function (i, course) {
                matches.push(course.code + ' - ' + course.name);
            });

            process(matches);
        }
    });

}]);

var Tool = {
    deepCopy: function (arr) {
        return JSON.parse(JSON.stringify(arr));
    },
    printError: function (msg, $scope) {
        $scope.error_display = true;
        $scope.error_message = msg;
    },
    sizeOf: function (obj) {
        return Object.keys(obj).length;
    },
    fillMatrix: function (arr, m, n, val) {
        var end = m + n;
        if (end > arr.length)
            return arr;

        var original = Tool.deepCopy(arr);
        arr = Tool.deepCopy(arr);
        for (var x = 0, k = arr[0].length; x < k; ++x) {
            var jump = false;
            for (var y = m; y < end; ++y) {
                if (arr[y][x] === 0) {
                    arr[y][x] = val;
                    continue;
                }
                arr  = original;
                jump = true;
                break;
            }
            if (jump) continue;
            break;
        }

        if (JSON.stringify(arr) === JSON.stringify(original)) {
            for (var i in arr)
                arr[i].push(0);
            return Tool.fillMatrix(arr, m, n, val);
        }
        return arr;
    },
    calculateSpan: function (arr) {
        var result = Tool.deepCopy(arr);
        for (var col in result) {
            for (var row in result[col]) {
                var cell = result[row][col];
                if (cell.length) continue;

                result[row][col] = {
                    colspan: 0,
                    rowspan: 0
                }
            }
        }
    },
    pad: function (str, len, fill) {
        return ((new Array(len).fill(fill).join('')) + str).substr(-len);
    }
};


