import mongoose from 'mongoose'

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log(
            `Database connected successfully @ ${mongoose.connection.host}`
                .bgGreen.bold
        )
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

connectDB()
