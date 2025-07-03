'use strict';

module.exports = function (schedule) {
	let employees = [];
	if (schedule) {
		for (let day in schedule) {
			employees = [...new Set([...employees, ...Object.keys(schedule[day])])];
		}
	}

	return employees;
};
