import express from 'express'
import routes from './routes'

const app = express()

app.use(routes)

// TODO move port to env
app.listen(3101, () => {
    console.log("server runnnig")
})
