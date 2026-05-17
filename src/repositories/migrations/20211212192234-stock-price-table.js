/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-undef */
"use strict"

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("stockPrice", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      symbol: {
        type: Sequelize.STRING(6),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(6, 2),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    }, {
      uniqueKeys: {
        actions_unique: {
          fields: ["symbol", "createdAt"]
        }
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("stockPrice")
  }
}
