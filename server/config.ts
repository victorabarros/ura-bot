const throwMissingVariable = (name: string) => { throw new Error(`missing required env variable "${name}"`) }

export default {
  port: process.env.PORT || throwMissingVariable("PORT"),
}
