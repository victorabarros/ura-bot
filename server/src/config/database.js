/* eslint-disable no-undef */
const throwMissingVariable = (name) => { throw new Error(`missing required env variable "${name}"`) }

module.exports = {
  dialect: process.env.DATABASE_DIALECT || "postgres",
  database: process.env.DATABASE_NAME || throwMissingVariable("DATABASE_NAME"),
  host: process.env.DATABASE_HOST || throwMissingVariable("DATABASE_HOST"),
  username: process.env.DATABASE_USERNAME || throwMissingVariable("DATABASE_USERNAME"),
  password: process.env.DATABASE_PASSWORD || throwMissingVariable("DATABASE_PASSWORD"),
  port: 5432,
  define: {
    timestamps: true,
  },
  dialectOptions: { decimalNumbers: true },
}
