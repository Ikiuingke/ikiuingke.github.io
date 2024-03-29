export default class VFSites extends HTMLElement {
	static get observedAttributes() {
		return ["sites"];
	}

	get sites() {
		return JSON.parse(this.getAttribute("sites")) || [];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "sites") {
			this.render(this.sites);
		}
	}
	connectedCallback() {
		this.render(this.sites);
	}

	render(sites) {
		const $sites = sites
			.map((site) => {
				const $site = document.createElement("vf-site");
				$site.setAttribute("site", JSON.stringify(site));
				return $site;
			})
			.map(($site) => {
				const $li = document.createElement("li");
				$li.append($site);
				return $li;
			});

		const ul = document.createElement("ul");
		ul.append(...$sites);
		this.replaceChildren(ul);
	}
}
