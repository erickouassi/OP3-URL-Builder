import fetch from "node-fetch";

export default async function handler(req, res) {
    const url = req.query.url;

    try {
        const head = await fetch(url, { method: "HEAD" });
        const size = head.headers.get("content-length");

        res.status(200).json({ size });
    } catch (err) {
        res.status(500).json({ size: null, error: err.message });
    }
}
