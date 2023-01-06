import { Options, Sequelize } from "sequelize"
import databaseConfig from "../config/database"

const connection = new Sequelize(databaseConfig as Options)

export default connection
