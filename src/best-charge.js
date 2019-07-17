// const itemsModule = require('./items.js');
// const promotionsModule = require('./promotions.js');

/**
 * bestCharge方法,对应MVC模型中的Controller控制层
 *
 * @param selectedItems
 * @returns {string}
 * @description
 * inputFormat:["id x quantity", "id2 x quantity2"]
 * output: string
 */
function bestCharge(selectedItems) {
  let items = loadAllItems(); //载入所有菜品信息
  let promotions = loadPromotions();  //载入所有优惠信息
  let inputOfJsonModel = preProInput(selectedItems);  //预处理输入数据,生成KV形式的JSON对象
  let summary = calcSummary(inputOfJsonModel, items, promotions);  //计算Model
  return generateOrderDetails(summary); //渲染输出内容模版View
}

/**
 * 预处理输入数据,生成KV形式的JSON对象
 *
 * @param selectedItems
 * @returns {Array}
 * @description
 * inputFormat:
 * ["id1 x quantity1","id1 x quantity1"]
 * outputFormat:
 * [{
 *      id1,
 *      quantity1
 * },
 * {
 *     id2,
 *     quantity2
 * }]
 */
function preProInput(selectedItems) {
  let result = [];
  selectedItems.forEach(item => {
    let tmpArr = item.split('x');
    result.push({'id': tmpArr[0].trim(), 'quantity': tmpArr[1].trim()});
  });
  return result;
}

/**
 * calcSummary方法,对应MVC模型中的Model层
 *
 * @param inputOfJsonModel
 * @param items
 * @param promotions
 * @returns {Object}
 * @description
 * inputFormat:
 * [{
 *      id1,
 *      quantity1
 * },
 * {
 *     id2,
 *     quantity2
 * }]
 * outputFormat:
 * {
 *    orderLists:[{
 *       name,
 *       quantity,
 *       sumPrice
 *     },
 *     {
 *   }],
 *   promotionType:{
 *     type,
 *     promotionItemNames:[name],
 *     economization
 *   },
 *   sum
 * }
 */
function calcSummary(inputOfJsonModel, items, promotions) {
  let orderLists = [];
  let promotionType = {};
  let sum = Number.MAX_VALUE;

  promotions.forEach(promotion => {
    let tmpOrderLists = [];
    let tmpPromotionType = {type: undefined, promotionItemNames: [], economization: 0};
    let tmpSum = 0;

    if (promotion.type === '指定菜品半价') {
      let halfPromotion = false;
      inputOfJsonModel.forEach(item => {
        let itemObj = items.filter(function (e) {
          return e.id === item.id;
        });
        let obj = {name: itemObj[0].name, quantity: item.quantity, sumPrice: itemObj[0].price * item.quantity};
        if (-1 !== promotion.items.indexOf(item.id)) {
          halfPromotion = true;
          tmpPromotionType.economization += obj.sumPrice / 2;
          tmpSum += obj.sumPrice / 2;
          tmpPromotionType.promotionItemNames.push(obj.name);
        }
        else {
          tmpSum += obj.sumPrice;
        }
        tmpOrderLists.push(obj);
      });
      halfPromotion ? tmpPromotionType.type = '指定菜品半价' : undefined;
    }
    if (promotion.type === '满30减6元') {
      inputOfJsonModel.forEach(item => {
        let itemObj = items.filter(function (e) {
          return e.id === item.id;
        });
        let obj = {name: itemObj[0].name, quantity: item.quantity, sumPrice: itemObj[0].price * item.quantity};
        tmpSum += obj.sumPrice;
        tmpOrderLists.push(obj);
      });
      if (tmpSum >= 30) {
        tmpPromotionType.type = '满30减6元';
        tmpPromotionType.economization = 6;
        tmpSum -= 6;
      }
    }
    if (tmpSum < sum) {
      orderLists = tmpOrderLists;
      promotionType.type = tmpPromotionType.type;
      promotionType.promotionItemNames = tmpPromotionType.promotionItemNames;
      promotionType.economization = tmpPromotionType.economization;
      sum = tmpSum;
    }
  });
  return {orderLists: orderLists, promotionType: promotionType, sum: sum};
}

/**
 * generateOrderDetails方法,对应MVC模型中的View视图层
 *
 * @param summary
 * @returns {string}
 * @description
 * inputFormat:
 * {
 *    orderLists:[{
 *       name,
 *       quantity,
 *       sumPrice
 *     },
 *     {
 *   }],
 *   promotionType:{
 *     type,
 *     promotionItemNames:[name],
 *     economization
 *   },
 *   sum
 * }
 * outputFormat:
 * string
 */
function generateOrderDetails(summary) {
  let orderDetails = '============= 订餐明细 =============\n';
  summary.orderLists.forEach(item => {
    orderDetails += item.name;
    orderDetails += ' x ';
    orderDetails += item.quantity;
    orderDetails += ' = ';
    orderDetails += item.sumPrice;
    orderDetails += '元\n';
  });
  orderDetails += '-----------------------------------\n';

  if (summary.promotionType.type === '指定菜品半价') {
    orderDetails += '使用优惠:\n';
    orderDetails += summary.promotionType.type;
    orderDetails += '(';
    summary.promotionType.promotionItemNames.forEach(item => {
      orderDetails += item;
      orderDetails += '，';
    });
    orderDetails = orderDetails.substring(0, orderDetails.lastIndexOf('，'));
    orderDetails += ')，省';
    orderDetails += summary.promotionType.economization;
    orderDetails += '元\n';
    orderDetails += '-----------------------------------\n';
  }

  if (summary.promotionType.type === '满30减6元') {
    orderDetails += '使用优惠:\n';
    orderDetails += summary.promotionType.type;
    orderDetails += '，';
    orderDetails += '省';
    orderDetails += summary.promotionType.economization;
    orderDetails += '元\n';
    orderDetails += '-----------------------------------\n';
  }

  orderDetails += '总计：';
  orderDetails += summary.sum;
  orderDetails += '元\n';
  orderDetails += '===================================';
  return orderDetails;
}
