'use strict';

export const WRITE_METRIC_DOCUMENTATION : { [key: string] : string[] } = {
    'writeDoubleMetric' : [
        'Writes a DOUBLE metric with the following information',
        '   imName - the name of the metric',
        '   tags - tags to add to the metric. You can just write "null" (without quotes) to keep this empty. If you want to include tags (and read the "Tags" section in metrics VERY carefully), you need to initialize a tag array prior to making the call to writeDoubleMetric',
        '   dsType - Either "counter" or "gauge". Most often, it\'s gauge.',
        '   value - a number (like 17.1 or 155513532423.1015) for the metric',
        '   isLiveConfig – a string that should be either "true" or "false"',
        '   displayName - A string to categorize the metric.',
        '   displayType - A string identifying the units of the display',
        '   identityTags - A string which corresponds to a key in the metric tag(s) array'],
    'writeComplexMetricString' : [
        'Writes a STRING metric with the following information',
        '   imName - the name of the metric',
        '   tags - tags to add to the metric. You can just write "null" (without quotes) to keep this empty. If you want to include tags (and read the "Tags" section in metrics VERY carefully), you need to initialize a tag array prior to making the call to writeDoubleMetric',
        '   dsType - Either "counter" or "gauge". Most often, it\'s gauge.',
        '   value - a string value like "Hey, i\'m a value"',
        '   isLiveConfig – a string that should be either "true" or "false"',
        '   displayName - A string to categorize the metric.',
        '   displayType - A string identifying the units of the display',
        '   identityTags - A string which corresponds to a key in the metric tag(s) array'],
    'writeComplexMetricObjectArray' : [
        'Writes a complex metric array the following information',
        '   imName - the name of the metric',
        '   tags - tags to add to the metric. You can just write "null" (without quotes) to keep this empty. If you want to include tags (and read the "Tags" section in metrics VERY carefully), you need to initialize a tag array prior to making the call to writeDoubleMetric',
        '   dsType - Either "counter" or "gauge". Most often, it\'s gauge.',
        '   value - complex array, eg:',
        '       iusers[0, "username"] = $1',
        '       iusers[0, "uid"] = $2',
        '       iusers[0, "gid"] = $3',
        '   isLiveConfig – a string that should be either "true" or "false"',
        '   displayName - A string to categorize the metric.',
        '   displayType - A string identifying the units of the display',
        '   identityTags - A string which corresponds to a key in the metric tag(s) array' ],
        'writeDebug' : [
            'Writes a string to the debug output for the AWK parser. The debug output is only visible when the command runner, or the indeni-collector (in a live system) is run under debug mode.'
        ],
        'writeTag' : [
            'Write a tag to be associated with a device. Tags can only be written in an interrogation script. These tags are used by monitoring scripts (as well as some interrogation scripts) in the "requires" section.'
        ]
};