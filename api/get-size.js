import fetch from "node-fetch";

export default async function handler(req, res) {
    const url = req.query.url;

    try {
        // 1. Try HEAD with browser-like headers
        let response = await fetch(url, {
            method: "HEAD",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "*/*"
            }
        });

        let size = response.headers.get("content-length");
        if (size) {
            return res.status(200).json({ size: Number(size) });
        }

        // 2. Try Range request (downloads 2 bytes)
        response = await fetch(url, {
            method: "GET",
            headers: {
                "Range": "bytes=0-1",
                "User-Agent": "Mozilla/5.0",
                "Accept": "*/*"
            }
        });

        const contentRange = response.headers.get("content-range");
        if (contentRange && contentRange.includes("/")) {
            const total = Number(contentRange.split("/")[1]);
            return res.status(200).json({ size: total });
        }

        // 3. Try full GET as last resort (downloads entire file)
        response = await fetch(url, {
            method: "GET",
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "*/*"
            }
        });

        const arrayBuffer = await response.arrayBuffer();
        return res.status(200).json({ size: arrayBuffer.byteLength });

    } catch (err) {
        return res.status(500).json({
            size: null,
            error: err.message
        });
    }
}
