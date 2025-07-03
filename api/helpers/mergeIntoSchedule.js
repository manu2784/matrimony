'use strict';

module.exports = function (teamSchedule, schedule) {
	if (Object.keys(teamSchedule).length === 0) return schedule;

	let teamScheduleDates = Object.keys(teamSchedule).sort();
	let scheduleDates = Object.keys(schedule).sort();

	for (let day of scheduleDates) {
		if (!teamSchedule[day]) {
			teamSchedule[day] = schedule[day];
			continue;
		}
		teamSchedule[day] = { ...teamSchedule[day], ...schedule[day] };
	}

	return teamSchedule;
};
