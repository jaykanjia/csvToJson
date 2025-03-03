import { BACKEND_URL, USER_EMAIL, USER_PASSWORD } from "./constants";

const getAuthToken = async () => {
	try {
		const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: USER_EMAIL,
				password: USER_PASSWORD,
			}),
		});
		const json = await res.json();

		console.log({ token: json.token });

		if (json.token) {
			return json.token;
		}
		throw new Error("not got token");
	} catch (error) {
		console.log({ error });

		throw new Error("something went wrong...");
	}
};

export default getAuthToken;
