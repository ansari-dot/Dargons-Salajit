const brandSchema = require('../models/brands.model.js')

const uploadBrandLogoService = async(file)=>{
    if(!file){
        throw new Error('File is required')
    }

    const existingLogo = await brandSchema.findOne()
    const logoUrl = `/uploads/brand-logos/${file.filename}`

    if(existingLogo){
        throw new Error("Brand logo already exist")
    }

    const brandLogo = await brandSchema.create({
        logoUrl,
        fileName:file.filename,
        fileSize:file.size,
        mimeType:file.mimetype
    })
}

const getBrandLogosService = async()=>{
    return await brandSchema.findOne()
}

const deleteBrandLogoService = async(logo_id)=>{
    if(!logo_id){
        throw new Error('Please select the brand logo')
    }
    const brandLogo = await brandSchema.deleteOne({_id:logo_id})

    return brandLogo
}