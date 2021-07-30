angular.module('ngIvrApp')
	.controller('synchronizerCtrl', function($scope, socket, $http, $rootScope, $state, $stateParams, ngivrService, ngivrSocketLock, Auth, $timeout) {

$scope.teszt={search:{name:'első teszt'}}

		$scope.ngivr = ngivrService;
		$scope.socketService = ngivrSocketLock;
		// $scope.masterSlaveId="masterSlaveConfig";
		// $scope.$parent.fullSizeRequired = 1;

		// $scope.$on('$destroy', function() {
		// 	$scope.$parent.fullSizeRequired = 0;
		// });

		$scope.go = (url) => {
			$state.go(url);
		}
		$scope.data = {};
		// Betölti a fő formot
		$scope.loadData = async() => {

			let x = await ngivrService.api.query('synchronizer');

			$scope.data = x.data.docs[0] || {};
		}
		$scope.loadData();


		$scope.query = {};
		$scope.list = {};
		// ha torles van, akkor igy kell hasznalni (ures lesz minden)
		$scope.$on(ngivr.settings.event.client.list.clear, () => {
			$scope.list.inputSearch = '';
		});


		$scope.search = function(query) {
			let search = $scope.list.inputSearch
			query.search = {
				$or: [{
					'name': {
						'$regex': search,
						'$options': 'i'
					}
				}]
			};
		};

		//id-t, illetve tokent szerez
		$scope.getID = async(length, obj, field) => {
			let rnd = await $http({
				method: 'GET',
				url: `/api/utilityServices/${length|0}`
			});
			console.log(rnd);
			obj[field] = rnd.data;
		}

		// 	// refresh sync status
		// 	socket.socket.on("synchronizer:save", (data) => {
		// 		for (let client of data.clientTokens) {
		// 			for (let localClient of $scope.data.clientTokens) {
		// 				if (client.id === localClient.id) {
		// 					localClient.online = client.online;
		// 					localClient.lastSeen = client.lastSeen;
		// 					localClient.lastSync = client.lastSync;
		// 				}
		// 			}
		// 		}
		// 		$scope.$apply();
		// 	});
		//
		//     $scope.lockForm=(id,value,lock)=>{
		//         const locker = {
		//           model: value,
		//           schema: 'Synchronizer',
		//           formName: "synchronizer_"+ id,
		//           event: '',
		//           lockUser: Auth.getCurrentUser(),
		//           locked: true
		//         }
		//         //$scope.lockerTicket.formName = "reconcilation_" + id;
		//         //$scope.lockerTicket.model = value;
		//         if (!lock) {
		//           $scope.socketService.remove(locker);
		//       } else {
		//           $scope.socketService.add(locker);
		//
		//       }
		//   };
		//
		//   $scope.locklist = [];

		socket.socket.on(ngivr.settings.socket.event.lock.list.update, function(data) {
			$scope.locklist = data.data;
			console.log("LOCKLIST:\n", data.data)
		});
		$scope.socketService.get();


		//NGIVR-list funkciók
		$scope.changeVisible = (item) => {
			item.enabled = !item.enabled;
			ngivrService.api.save('synchronizerClients', item);
		}

		$scope.showClientForm = (doc) => {
			$scope.showClientEditor = 0;
			if (doc && doc._id) {
				$scope.selectedClient = doc._id.toString();
				$scope.selectedClientModel = doc;
			} else {
				$scope.selectedClient = undefined;
				$scope.selectedClientModel = {}
			}
			$scope.showClientEditor = 1;
		}

		$scope.ngivrClientClose = function() {
			$scope.showClientEditor = 0;
			$timeout(() => $scope.$apply());
		};

	})
