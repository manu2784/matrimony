'use strict';

module.exports = function (schedule) {
	let employees = [];
	let dates = Object.keys(schedule).sort();

	for (let day of dates) {
		console.log('@@@@@@', day);
		employees = [...new Set([...employees, ...Object.keys(schedule[day])])];
	}

	return employees;
};
