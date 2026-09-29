const express = require('express');
const router = express.Router()

// ── Geo-IP providers ─────────────────────────────────────────────────────────
// Tried in order, the first provider that returns a real country code wins.
// No API keys required. ipwho.is / freeipapi are HTTPS; ip-api.com free tier is HTTP only.
const GEO_PROVIDERS = [
    {
        name: 'ipwho.is',
        url: (ip) => `https://ipwho.is/${ip}`,
        parse: (d) => (d && d.success !== false && d.country_code
            ? {
                countryCode: d.country_code,
                country: d.country,
                city: d.city,
                region: d.region,
                latitude: d.latitude,
                longitude: d.longitude,
                timezone: d.timezone && d.timezone.id,
            }
            : null),
    },
    {
        name: 'freeipapi.com',
        url: (ip) => `https://freeipapi.com/api/json/${ip}`,
        parse: (d) => (d && d.countryCode
            ? {
                countryCode: d.countryCode,
                country: d.countryName,
                city: d.cityName,
                region: d.regionName,
                latitude: d.latitude,
                longitude: d.longitude,
                timezone: Array.isArray(d.timeZones) ? d.timeZones[0] : undefined,
            }
            : null),
    },
    {
        name: 'ip-api.com',
        url: (ip) => `http://ip-api.com/json/${ip}`,
        parse: (d) => (d && d.status === 'success' && d.countryCode
            ? {
                countryCode: d.countryCode,
                country: d.country,
                city: d.city,
                region: d.regionName,
                latitude: d.lat,
                longitude: d.lon,
                timezone: d.timezone,
            }
            : null),
    },
];

// Ask every provider until one of them resolves the IP to a country
const lookupCountry = async (ip) => {
    for (const provider of GEO_PROVIDERS) {
        try {
            const response = await fetch(provider.url(ip), {
                headers: { 'User-Agent': 'palses-storefront' },
                signal: AbortSignal.timeout(6000),
            });

            if (!response.ok) {
                continue; // e.g. ipapi.co answers 429 when rate limited
            }

            const data = await response.json();
            const geo = provider.parse(data);

            if (geo && geo.countryCode) {
                return { ...geo, countryCode: String(geo.countryCode).toUpperCase(), provider: provider.name };
            }
        } catch (error) {
            // Try the next provider
        }
    }

    return null;
};

router.get('/', async (req, res) => {
    try {

        // get user IP
        const forwarded = req.headers["x-forwarded-for"]

        let ip = forwarded ? forwarded.split(",")[0].trim() : req.socket.remoteAddress;

        if (ip === "::1" || ip === "127.0.0.1" || ip === "::ffff:127.0.0.1") {
            const ipResponse = await fetch("https://api.ipify.org?format=json");
            const ipData = await ipResponse.json();

            ip = ipData.ip;

        }
        console.log('User IP:', ip);

        // Resolve the visitor country (never trust a single provider)
        const geo = await lookupCountry(ip);
        const countryCode = geo ? geo.countryCode : '';

        // Pakistan → PKR. Any other DETECTED country → USD.
        // When the country cannot be determined we return null so the storefront
        // keeps its PKR base currency instead of wrongly showing USD.
        const currency = countryCode ? (countryCode === 'PK' ? 'PKR' : 'USD') : null;

        res.json({
            message: 'location fetch successfully',
            success: true,
            location: {
                ip,
                country: geo ? geo.country : null,
                countryCode: countryCode || null,
                city: geo ? geo.city : null,
                region: geo ? geo.region : null,
                latitude: geo ? geo.latitude : null,
                longitude: geo ? geo.longitude : null,
                timezone: geo ? geo.timezone : null,
                currency,
                detected: Boolean(countryCode),
                provider: geo ? geo.provider : null,
            }
        })


    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Unable to determine location",
        })
    }
})

module.exports = router;
