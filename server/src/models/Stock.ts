import { Model, DataTypes } from "sequelize"
import connection from "../database"

class Stock extends Model {
  public id!: number
  public symbol!: string
  public price!: number
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

Stock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    symbol: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize: connection,
    tableName: "stockPrice",
  }
)

export default Stock
