const vinylFinder = {
	// update the input placeholder
	updateSearchPlaceholder: function () {
		var input = document.querySelector("#gsc-i-id1");
		if (input) {
			input.placeholder =
				"Artist, album, track, label, cat#, date, description…";
		}
	},

	init: function () {
		this.updateSearchPlaceholder();
		// give a ready state to the html page
		document.querySelector(".SiteBody").classList.add("is-ready");
	},
};

window.onload = function () {
	vinylFinder.init();
};
