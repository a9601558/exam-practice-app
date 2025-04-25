import { sequelize } from '../config/db';

// 导入模型
import User from './User';
import Question from './Question';
import QuestionSet from './QuestionSet';
import Purchase from './Purchase';
import RedeemCode from './RedeemCode';
import Option from './Option';

// 设置模型关联
User.hasMany(Purchase, {
  foreignKey: 'userId',
  as: 'userPurchases'
});
Purchase.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

QuestionSet.hasMany(Question, {
  foreignKey: 'questionSetId',
  as: 'questions'
});
Question.belongsTo(QuestionSet, {
  foreignKey: 'questionSetId',
  as: 'questionSet'
});

Question.hasMany(Option, {
  foreignKey: 'questionId',
  as: 'options'
});
Option.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

QuestionSet.hasMany(Purchase, {
  foreignKey: 'quizId',
  as: 'purchases'
});
Purchase.belongsTo(QuestionSet, {
  foreignKey: 'quizId',
  as: 'questionSet'
});

QuestionSet.hasMany(RedeemCode, {
  foreignKey: 'questionSetId',
  as: 'redeemCodes'
});
RedeemCode.belongsTo(QuestionSet, {
  foreignKey: 'questionSetId',
  as: 'questionSet'
});

User.hasMany(RedeemCode, {
  foreignKey: 'usedBy',
  as: 'redeemedCodes'
});
RedeemCode.belongsTo(User, {
  foreignKey: 'usedBy',
  as: 'user'
});

User.hasMany(RedeemCode, {
  foreignKey: 'createdBy',
  as: 'createdCodes'
});
RedeemCode.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

export {
  sequelize,
  User,
  Question,
  QuestionSet,
  Purchase,
  RedeemCode,
  Option
}; 