import { Router } from 'express'

const routes = Router()

routes.get('/health', (req, res) => {
    // TODO ping dependencies
    return res.json({ health: 'check' })
})

export default routes;
