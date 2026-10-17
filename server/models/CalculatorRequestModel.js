const db = require('../config/db');

class CalculatorRequestModel{

    // Create quotation request
    static async createRequest(data){
        
        const [result] = await db.query(
            `
            INSERT INTO calculator_requests (

                user_id,

                product_id,
                product_name,

                package_type,
                fill_size,
                strength,

                finished_quantity,

                packaging_id,
                packaging_name,
                packaging_purchase_quantity,

                product_cost,
                packaging_cost,

                printing_cost,
                setup_cost,
                other_costs,

                shipping,
                discount,

                estimated_project_cost,

                status

            )

            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                data.userId || null,

                data.productId,
                data.productName,

                data.packageType,
                data.fillSize,
                data.strength || null,

                data.finishedQuantity,

                data.packagingId,
                data.packagingName,
                data.packagingPurchaseQuantity,

                data.productCost,
                data.packagingCost,

                data.printingCost,
                data.setupCost,
                data.otherCosts,

                data.shipping,
                data.discount,

                data.estimatedProjectCost,

                "pending"
            ]
        );

        return result.insertId;
    }


    static async findAll (){
        const [rows] = await db.query(
              `
            SELECT *
            FROM calculator_requests
            ORDER BY created_at DESC
            `
        );

        return rows;
    }

    /**
     * Admin list: the same rows (newest first) plus the requesting user's
     * contact details. LEFT JOIN so guest requests (user_id NULL) still show.
     */
    static async findAllWithUser (){
        const [rows] = await db.query(
              `
            SELECT
                cr.*,
                u.first_name AS user_first_name,
                u.last_name  AS user_last_name,
                u.email      AS user_email,
                u.phone      AS user_phone
            FROM calculator_requests cr
            LEFT JOIN users u ON u.id = cr.user_id
            ORDER BY cr.created_at DESC
            `
        );

        return rows;
    }

    static async findById(requestId){
        const [rows] = await db.query(
             `
            SELECT *
            FROM calculator_requests
            WHERE id = ?
            `,
            [requestId]
        );

        return rows[0] || null;
    }


    static async UpdateStatus(requestId,status,adminNote=null){
        const [result] = await db.query(
            `
            UPDATE calculator_requests
            SET
                status = ?,
                admin_note = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            `,
            [status, adminNote, requestId]
        );

        return result;
    }


     static async findByUserId(userId) {

        const [rows] = await db.query(
            `
            SELECT *
            FROM calculator_requests
            WHERE user_id = ?
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return rows;
    }

}

module.exports = CalculatorRequestModel;