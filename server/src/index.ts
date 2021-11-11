import express from 'express'
import routes from './routes'
import config from '../config'

const app = express()
const { port } = config

app.use(routes)

app.listen(port, () => console.log(`runnnig on port ${port}`))
