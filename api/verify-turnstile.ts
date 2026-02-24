import type { VercelRequest, VercelResponse } from "@vercel/node";

const SITEVERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        console.error("TURNSTILE_SECRET_KEY is not set");
        return res.status(500).json({ success: false, error: "Server misconfigured" });
    }

    const { token } = req.body ?? {};
    if (!token || typeof token !== "string" || token.length > 2048) {
        return res.status(400).json({ success: false, error: "Invalid token" });
    }

    try {
        const ip =
            (req.headers["cf-connecting-ip"] as string) ??
            (req.headers["x-forwarded-for"] as string) ??
            req.socket.remoteAddress ??
            "";

        const response = await fetch(SITEVERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                secret: secretKey,
                response: token,
                remoteip: ip,
            }),
        });

        const result = await response.json();

        return res.status(result.success ? 200 : 403).json({
            success: result.success,
            "error-codes": result["error-codes"],
        });
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return res.status(500).json({ success: false, error: "Verification failed" });
    }
}
