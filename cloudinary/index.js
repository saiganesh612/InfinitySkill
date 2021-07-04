const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary")

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "InfiniteSkill",
        allowedFormats: ['jpeg', 'jpg', 'png', 'pdf', 'docx']
    }
})

const deleteImage = async filename => {
    try {
        const result = await cloudinary.uploader.destroy(filename, { invalidate: true })
        return result
    } catch (err) {
        return err
    }
}

module.exports = { cloudinary, storage, deleteImage }
