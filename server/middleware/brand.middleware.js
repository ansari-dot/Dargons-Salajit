const multer = require('multer')
const fs = require('fs')
const path = require('path')

const uploadDir = path.join(__dirname, "../uploads/brand-logos")

// Make sure the brand logo upload folder exists before multer writes into it
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

const storeBrandLogos = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir)
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname)

        const filename = `logo-${Date.now()}-${Math.round(Math.random() * 1e9)}` + extension;
        cb(null, filename)
    }
})

const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(
            new Error(
                "Only PNG, JPG, JPEG and WEBP files are allowed"
            ),
            false
        );
    }
}


const uploadBrandLogo = multer({
    storage: storeBrandLogos,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
})

module.exports = uploadBrandLogo
