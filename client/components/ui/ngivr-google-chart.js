/*jshint esnext: true */
/*jshint asi:true, undef:true*/
/*global console,ngivr,_,google*/
'use strict';
ngivr.angular.directive('ngivrGoogleCharts', () => {
	return {
		restrict: "E",
		scope: {
			ngModel: "=",
			chartType: '@',
			options: '<',
			rangeFilter: '<'
		},
		link: function(scope, el, attr) {
			scope.options = scope.options || {};

			scope.chartType = scope.chartType || 'bar'
			let chartModuleName = _.capitalize(scope.chartType);
			scope.options.width = '100%';
			scope.options.height = '100%';
			scope.options.theme = 'material';
			el.addClass('ngivr-google-chart-container');
			// TODO: separate drawing from creating and respond to resize

			scope.chartReady=false;

			let drawChart = function() {
				scope.chartReady=true;
				if (!scope.ngModel) {
					return;
				}
				//tömböt át kell alakítani dataTable formátumra
				let data = google.visualization.arrayToDataTable(scope.ngModel);
				//
				let control = new google.visualization.ControlWrapper({
					controlType: 'ChartRangeFilter',
					containerId: 'control-div',
					options: {
						filterColumnIndex: 0,
						ui: {
							chartOptions: {
								height: 50,
								chartArea: {left:45, width:'65%'}
							}
						}
					}
				});

				let chart = new google.visualization.ChartWrapper({
					chartType: chartModuleName,
					containerId: "chart-div",
					options: google.charts[chartModuleName].convertOptions(scope.options),

				})


				function setOptions() {
					if (!dash) {
						return;
					}
					let firstDate;
					let lastDate;
					let v = control.getState();

					if (v.range) {
						document.getElementById('dbgchart').innerHTML = v.range.start + ' to ' + v.range.end;
						firstDate = new Date(v.range.start.getTime() + 1);
						lastDate = new Date(v.range.end.getTime() - 1);
					} else {
						firstDate = data.getValue(0, 0);
						lastDate = data.getValue(data.getNumberOfRows() - 1, 0);
					}

					// let ticks = [];
					// for (var i = firstDate.getMonth(); i <= lastDate.getMonth(); i++) {
					// 	ticks.push(data.getValue(i, 0));
					// }
					//
					// chart.setOption('hAxis.ticks', ticks);
					chart.setOption('hAxis.viewWindow.min', firstDate);
					chart.setOption('hAxis.viewWindow.max', lastDate);
					if (dash) {
						chart.draw();
					}
				}

				setOptions();
				google.visualization.events.addListener(control, 'statechange', setOptions);

				var dash = new google.visualization.Dashboard(document.getElementById('dashboard'));
				dash.bind([control], [chart]);
				dash.draw(data);
			}


			//load the google charts library
			google.charts.load('current', {
				packages: [scope.chartType, 'controls'],
				language: 'hu'
			});
			//callback draws the chart when loading finished.
			google.charts.setOnLoadCallback(drawChart);

			//DEEP watch
			scope.$watch('ngModel', () => {
				if (scope.chartReady) {
					drawChart();
				}
			}, true)
		},
		template: `
		<div id="dashboard" class="ngivr-google-chart-dasboard">
			<div id="chart-div" class="ngivr-google-chart-chart"></div>
			<div id="control-div" class="ngivr-google-chart-control"></div>
		    <p><span id="dbgchart"></span></p>
		</div>
		`
	}
});
