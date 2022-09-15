'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserNotification extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserNotification.belongsTo(models.User)
    }
  }
  UserNotification.init({
    UserId: DataTypes.INTEGER,
    MountainId: DataTypes.STRING,
    temperature: DataTypes.INTEGER,
    apparentTemperature: DataTypes.INTEGER,
    rainrate: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserNotification',
  });
  return UserNotification;
};