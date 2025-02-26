export const generateSlug = (title: string): string => {
	return title
		.toLowerCase() // convert to lowercase
		.trim() // remove leading and trailing spaces
		.replace(/[^a-z0-9\s-]/g, "") // allow Latin-1 characters, alphanumeric, spaces, and hyphens
		.replace(/\s+/g, "-") // replace spaces with hyphens
		.replace(/-+/g, "-"); // remove consecutive hyphens
};
