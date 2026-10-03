const {
    getCurrencyInfo,
    FALLBACK_CURRENCY,
} = require("../services/currencyExchange.service");

const GEO_PROVIDERS = [
    {
        name: "ipwho.is",

        url: (ip) =>`https://ipwho.is/${encodeURIComponent(ip)}`,

        parse: (data) => {
            if (
                !data ||
                data.success === false ||
                !data.country_code
            ) {
                return null;
            }

            return {
                countryCode: data.country_code,
                country: data.country,
                city: data.city,
                region: data.region,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: data.timezone?.id || null,
            };
},
    },

    {
        name: "freeipapi.com",

        url: (ip) =>`https://freeipapi.com/api/json/${encodeURIComponent(ip)}`,

        parse: (data) => {
            if (!data || !data.countryCode) {
                return null;
            }

            return {
                countryCode: data.countryCode,
                country: data.countryName,
                city: data.cityName,
                region: data.regionName,
                latitude: data.latitude,
                longitude: data.longitude,
                timezone: Array.isArray(data.timeZones)
                    ? data.timeZones[0]
                    : null,
            };
        },
    },

    {
        name: "ip-api.com",

        url: (ip) =>`http://ip-api.com/json/${encodeURIComponent(ip)}`,

        parse: (data) => {
            if (
                !data ||
                data.status !== "success" ||
                !data.countryCode
            ) {
                return null;
            }

            return {
                countryCode: data.countryCode,
                country: data.country,
                city: data.city,
                region: data.regionName,
                latitude: data.lat,
                longitude: data.lon,
                timezone: data.timezone,
            };
        },
    },
];

// ============================================================
// GEO LOOKUP
// ============================================================

const lookupCountry = async (ip) => {
    for (const provider of GEO_PROVIDERS) {
        try {
            console.log(`Trying provider: ${provider.name}`);

            const response = await fetch(
                provider.url(ip),
                {
                    headers: {
                        "User-Agent":
                            "storefront-location-service",
                    },

                    signal:
                        AbortSignal.timeout(6000),
                }
            );

            if (!response.ok) {
                continue;
            }

            const data =
                await response.json();

            const geo =
                provider.parse(data);

            if (
                geo &&
                geo.countryCode
            ) {
                return {
                    ...geo,

                    countryCode:
                        String(
                            geo.countryCode
                        ).toUpperCase(),

                    provider:
                        provider.name,
                };
            }
        } catch (error) {
            console.error(
                `${provider.name} error:`,
                error.message
            );
        }
    }

    return null;
};

// ============================================================
// LOCATION CONTROLLER
// ============================================================

const getLocationController = async (req, res) => {
    try {
        // Prevent browser/proxy caching
        res.set({
            "Cache-Control":
                "no-store, no-cache, must-revalidate, proxy-revalidate",

            Pragma: "no-cache",

            Expires: "0",
        });

        // ----------------------------------------------------
        // IP MUST COME FROM FRONTEND
        // ----------------------------------------------------

        const ip = req.query.ip;

        if (!ip) {
            return res.status(400).json({
                success: false,
                message:"Browser public IP is required",
            });
        }

        console.log(
            "===================================="
        );

        console.log(
            "Browser IP:",
            ip
        );
        const geo =
            await lookupCountry(ip);

        if (!geo) {
            return res.status(200).json({
                success: true,

                message:
                    "Location could not be detected",

                location: {
                    ip,

                    country: null,

                    countryCode: null,

                    city: null,

                    region: null,

                    latitude: null,

                    longitude: null,

                    timezone: null,

                    baseCurrency: "PKR",

                    currency: FALLBACK_CURRENCY,

                    currencyName: "US Dollar",

                    isArabCountry: false,

                    exchangeRate: 1,

                    rates: {},

                    detected: false,

                    provider: null,
                },
            });
        }

        // ----------------------------------------------------
        // GET CURRENCY + CURRENT EXCHANGE RATE
        // ----------------------------------------------------

        const currencyInfo =
            await getCurrencyInfo(
                geo.countryCode
            );

        // ----------------------------------------------------
        // LOG
        // ----------------------------------------------------

        console.log(
            "Country:",
            geo.country
        );

        console.log(
            "Country Code:",
            geo.countryCode
        );

        console.log(
            "Currency:",
            currencyInfo.currency,
            `— ${currencyInfo.currencyName}`
        );

        console.log(
            "Arab country:",
            currencyInfo.isArabCountry ? "yes" : "no"
        );

        console.log(
            "Rate (1 PKR):",
            currencyInfo.exchangeRate,
            currencyInfo.currency
        );

        console.log(
            "Exchange Rate:",
            currencyInfo.exchangeRate
        );

        console.log(
            "===================================="
        );

        // ----------------------------------------------------
        // RESPONSE
        // ----------------------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Location fetched successfully",

            location: {
                ip,

                country:
                    geo.country || null,

                countryCode:
                    geo.countryCode || null,

                city:
                    geo.city || null,

                region:
                    geo.region || null,

                latitude:
                    geo.latitude || null,

                longitude:
                    geo.longitude || null,

                timezone:
                    geo.timezone || null,

                provider:
                    geo.provider || null,

                detected: true,

                // Currency
                // Pakistan → PKR · Arab League country → AED / SAR / QAR …
                // Every other country → USD. All stored prices are PKR.
                baseCurrency:
                    currencyInfo.baseCurrency,

                currency:
                    currencyInfo.currency,

                currencyName:
                    currencyInfo.currencyName,

                isArabCountry:
                    currencyInfo.isArabCountry,

                exchangeRate:
                    currencyInfo.exchangeRate,

                rates:
                    currencyInfo.rates,
            },
        });

    } catch (error) {
        console.error(
            "Location controller error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Unable to determine location",

            error:
                process.env.NODE_ENV === "development"
                    ? error.message
                    : undefined,
        });
    }
};

module.exports = {
    getLocationController,
};