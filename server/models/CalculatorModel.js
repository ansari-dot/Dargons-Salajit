const db = require("../config/db");

class CalculatorModel {

    // Get product pricing
    static async getProductOption({
        productId,
        packageType,
        fillSize,
        strength
    }) {

        const [rows] = await db.query(
            `
            SELECT
                cpo.*,
                p.name AS product_name
            FROM calculator_product_options cpo
            INNER JOIN products p
                ON p.id = cpo.product_id
            WHERE cpo.product_id = ?
              AND cpo.package_type = ?
              AND cpo.fill_size = ?
              AND (
                    cpo.strength = ?
                    OR cpo.strength IS NULL
                  )
              AND cpo.is_active = 1
            LIMIT 1
            `,
            [
                productId,
                packageType,
                fillSize,
                strength || null
            ]
        );

        return rows[0] || null;
    }


    // Get packaging
    static async getPackaging(packagingId) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM calculator_packaging
            WHERE id = ?
              AND is_active = 1
            LIMIT 1
            `,
            [packagingId]
        );

        return rows[0] || null;
    }


    // Get the dropdown options shown on the calculator page
    static async getOptions() {

        const [products] = await db.query(
            `
            SELECT DISTINCT p.id, p.name
            FROM calculator_product_options cpo
            INNER JOIN products p
                ON p.id = cpo.product_id
            WHERE cpo.is_active = 1
            ORDER BY p.name
            `
        );

        const [packaging] = await db.query(
            `
            SELECT id, name, packaging_type
            FROM calculator_packaging
            WHERE is_active = 1
            ORDER BY id
            `
        );

        return { products, packaging };
    }
}

module.exports = CalculatorModel;