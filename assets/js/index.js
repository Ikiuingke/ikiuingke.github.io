import "./components/index.js";

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
		document.querySelector("body").setAttribute("is-ready", true);
	},
};

window.onload = function () {
	vinylFinder.init();
};
