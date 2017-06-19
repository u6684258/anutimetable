What's new in ANU Timetable V2
- new responsive design, mobile friendly
- removed offline JSON import
- click on the venue link will direct you to official map
- combination selector

New structure of timetable.json:
- now all classes within the same course are combined to one course entry
- removed full name list and course id, it's now using the course code as an identifier to achieve an quick crossover when there're any updates
- location list now includes an id relevant to the ANU map
'''[
    {
        course_code: [course_name, [
            class1: [
                [group_start, group_duration, group_day, location_id],
                [group_start, ...]
                , ...
            ],
            class2: ... 
        ]], 
        course_code: ...
    }, 
    [
        [location_name, location_link],
        [location_name, location_link],
        ...
    ]
]'''