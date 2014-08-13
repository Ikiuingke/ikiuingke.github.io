var myFirebaseRef = new Firebase("https://lpepfinder.firebaseio.com/");

// on dom ready
$(function(){

	var $FormEl = $('form.gsc-search-box');
	// var $FormEl = $('#cse-search-box');
	var searchValue = null;

	// get input value on submit and store it as new Firebase object
	$FormEl.on('submit', function(event){
		event.preventDefault();
		console.log('sumbit');

		// searchValue = $(this).find('#gsc-i-id1').val();
		// myFirebaseRef.set({
		// 	title: searchValue
		// });
	});
});
