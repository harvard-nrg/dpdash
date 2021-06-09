const configs = {};
configs.colormap = [
            {
                category : "daily_survey",
                analysis : "timestamp",
                variable : "daily_surveyAnswers_hours_since_1",
                label : "daily_survey",
                range : [0, 24],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "daily_survey",
                analysis : "questionnaireStat",
                variable : "DAILY_1_NUM_UNANSWERED",
                label : "unanswered_num",
                range : [0, 10],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "voice",
                analysis : "timestamp",
                variable : "daily_voiceRecording_hours_since_1",
                label : "daily_voice",
                range : [0, 24],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "weekly_survey",
                analysis : "timestamp",
                variable : "weekly_surveyAnswers_hours_since_1",
                label : "weekly_survey",
                range : [0, 24],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "weekly_survey",
                analysis : "questionnaireStat",
                variable : "WEEKLY_1_NUM_UNANSWERED",
                label : "unanswered_num",
                range : [0, 10],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "actigraphy",
                analysis : "Geneactivwrist",
                variable : "button",
                label : "button",
                range : [10, 50],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text: true
            },
            {
                category : "balancesheet",
                analysis : "balancesheetGps",
                variable : "gps_count",
                label : "gps_file_count",
                range : [0, 24],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text : true
            },
            {
                category : "balancesheet",
                analysis : "balancesheetAccel",
                variable : "accel_count",
                label : "accel_file_count",
                range : [0, 24],
                color : ["#ffffd9", "#edf8b1", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8", "#253494", "#081d58"],
                text : true
            }
        ];

export default configs;
