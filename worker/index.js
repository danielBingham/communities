
const mime = require('mime')
const sharp = require('sharp')

const { 
    Core, 
    ServiceError, 

    FileDAO,

    S3FileService
} = require('@communities/backend')

const config = require('./config')

const core = new Core('worker', config)
core.initialize()


core.queue.process('resize-image', async function(job, done) {
    core.logger.setId(`Image resize: ${job.id}`)
    core.logger.debug(`Beginning job 'resize-image' for user ${job.data.session.user.id}.`)

    const fileDAO = new FileDAO(core)
    const fileService = new S3FileService(core)

    try {
        job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: 0 })

        const fileSizes = [ 30, 200, 325, 650]

        const filepath = job.data.file.filepath
        const fileContents = await fileService.getFile(filepath)
       
        let progress = 0
        for (const size of fileSizes) {
            const resizedPath = `files/${job.data.file.id}.${size}.${mime.getExtension(job.data.file.type)}`

            await sharp(fileContents)
                .resize({ width: size })
                .toFile(resizedPath)

            await fileService.uploadFile(resizedPath, resizedPath)
            fileService.removeLocalFile(resizedPath)

            progress += 20
            job.progress({ step: 'initializing', stepDescription: `Initializing...`, progress: progress })
        }

        job.progress({ step: 'complete', stepDescription: `Complete!`, progress: 100 })

        core.logger.debug(`Finished job 'resize-image' for user ${job.data.session.user.id}.`)
        core.logger.setId(null)
        done(null)
    } catch (error) {
        core.logger.error(error)
        done(error)
    }
})

core.logger.info('Initialized and listening...')

const shutdown = async function() {
    core.logger.info('Attempting a graceful shutdown...')
    await core.shutdown() 
    process.exit(0)
}

// We've gotten the termination signal, attempt a graceful shutdown.
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
