import { createEvent, getEvents } from "@/controllers/events";

export default async function handler(req, res) {
	const { method } = req;
	if (method === "GET") {
		return getEvents(req, res);
	}
	if (method === "POST") {
		return createEvent(req, res);
	}
}
