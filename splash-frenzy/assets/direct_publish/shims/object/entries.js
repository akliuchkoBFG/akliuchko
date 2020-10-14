if (!Object.entries) {
	Object.entries = (obj) => {
		return Object.keys(obj)
			.map((key) => (
				[key, obj[key]]
			));
	};
}