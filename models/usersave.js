'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserSave extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      UserSave.belongsTo(models.User)
    }
  }
  UserSave.init({
    UserId: DataTypes.INTEGER,
    MountainId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'UserSave',
  });
  return UserSave;
};