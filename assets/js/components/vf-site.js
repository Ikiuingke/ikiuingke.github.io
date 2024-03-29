export default class VFSite extends HTMLElement {
	static get observedAttributes() {
		return ["site"];
	}

	get site() {
		return JSON.parse(this.getAttribute("site")) || {};
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "site") {
			this.render(this.site);
		}
	}

	buildUrl(url) {
		const cleanUrl = url.replace("*.", "");
		const urlData = new URL(`https://${cleanUrl}`);
		return urlData.origin;
	}

	render(site) {
		const url = this.buildUrl(site.url);
		const name = site.name;

		const vfSiteName = document.createElement("vf-site-name");
		vfSiteName.textContent = name;

		const vfSiteUrl = document.createElement("vf-site-url");
		const link = document.createElement("a");
		link.setAttribute("target", "_blank");
		link.setAttribute("rel", "noref noopener");
		link.href = url;
		link.textContent = url;
		vfSiteUrl.appendChild(link);

		this.replaceChildren(vfSiteName, vfSiteUrl);
	}
}
